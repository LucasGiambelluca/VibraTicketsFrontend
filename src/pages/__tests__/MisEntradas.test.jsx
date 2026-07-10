import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MisEntradas from '../MisEntradas';

// Mock de la capa de API: MisEntradas intenta usersApi.getMyTickets primero
// y solo cae a los fallbacks (getMyOrders / testPaymentsApi) si viene vacío.
vi.mock('../../services/apiService', () => ({
  usersApi: {
    getMyTickets: vi.fn(),
    getMyOrders: vi.fn(),
  },
  testPaymentsApi: {
    getMyTickets: vi.fn(),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Test User' }, isAuthenticated: true }),
}));

import { usersApi } from '../../services/apiService';

describe('MisEntradas - mapeo de campos devueltos por getMyTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lee venue_name (no ticket.venue), muestra "Usado" para SCANNED y usa ticketNumber (no ticket_number)', async () => {
    const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    usersApi.getMyTickets.mockResolvedValue({
      tickets: [
        {
          id: 1,
          status: 'SCANNED', // debe mapear a "Usado" igual que REDEEMED
          event_name: 'Rs Fest',
          venue_name: 'Estadio Test', // API real: venue_name, NO "venue"
          show_date: inTwoHours,
          sector: 'VIP',
          seat_number: '10',
          ticketNumber: 'TICKET-1-9999-ABCDEF', // API real: ticketNumber (camelCase)
          availability_status: 'available',
        },
      ],
    });

    render(
      <MemoryRouter>
        <MisEntradas />
      </MemoryRouter>
    );

    // Venue: debe leer ticket.venue_name, no el inexistente ticket.venue
    await waitFor(() => expect(screen.getByText('Estadio Test')).toBeInTheDocument());
    expect(screen.queryByText('Venue')).not.toBeInTheDocument();

    // Estado SCANNED -> tag "Usado"
    expect(screen.getByText('Usado')).toBeInTheDocument();

    // Sufijo del ticket: debe salir de ticketNumber, no de ticket_number (undefined)
    expect(screen.queryByText(/------/)).not.toBeInTheDocument();
    expect(screen.getByText('#ABCDEF')).toBeInTheDocument();
  });
});
