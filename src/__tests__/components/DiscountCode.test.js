import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DiscountCodeAdvanced from '../../components/checkout/DiscountCodeAdvanced';
import { discountService } from '../../services/discountServiceComplete';

// Mock del servicio
jest.mock('../../services/discountServiceComplete');

// Mock de antd message
jest.mock('antd', () => {
  const actual = jest.requireActual('antd');
  return {
    ...actual,
    message: {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warning: jest.fn()
    }
  };
});

describe('DiscountCodeAdvanced Component', () => {
  const mockProps = {
    orderTotal: 10000, // $100.00
    eventId: 1,
    showId: 1,
    userId: 123,
    onDiscountApplied: jest.fn(),
    onDiscountRemoved: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders discount code input correctly', () => {
    render(<DiscountCodeAdvanced {...mockProps} />);
    
    expect(screen.getByText(/¿Tienes un código de descuento?/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ingresa tu código/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aplicar/i })).toBeInTheDocument();
  });

  test('validates and applies valid percentage discount code', async () => {
    const mockDiscount = {
      valid: true,
      discount: {
        code: 'TEST20',
        description: 'Test discount 20%',
        discount_type: 'PERCENTAGE',
        discount_value: 20,
        maximum_discount: null
      }
    };

    discountService.validateCode.mockResolvedValue(mockDiscount);

    render(<DiscountCodeAdvanced {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/ingresa tu código/i);
    const button = screen.getByRole('button', { name: /aplicar/i });

    // Ingresar código
    fireEvent.change(input, { target: { value: 'TEST20' } });
    expect(input.value).toBe('TEST20');

    // Aplicar código
    fireEvent.click(button);

    await waitFor(() => {
      expect(discountService.validateCode).toHaveBeenCalledWith(
        'TEST20',
        10000,
        123
      );
      expect(mockProps.onDiscountApplied).toHaveBeenCalled();
    });

    // Verificar que se muestra el descuento aplicado
    await waitFor(() => {
      expect(screen.getByText('TEST20')).toBeInTheDocument();
      expect(screen.getByText(/Test discount 20%/i)).toBeInTheDocument();
      expect(screen.getByText(/-20%/)).toBeInTheDocument();
    });
  });

  test('validates and applies fixed amount discount code', async () => {
    const mockDiscount = {
      valid: true,
      discount: {
        code: 'FIXED1000',
        description: 'Descuento de $1000',
        discount_type: 'FIXED_AMOUNT',
        discount_value: 1000
      }
    };

    discountService.validateCode.mockResolvedValue(mockDiscount);

    render(<DiscountCodeAdvanced {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/ingresa tu código/i);
    const button = screen.getByRole('button', { name: /aplicar/i });

    fireEvent.change(input, { target: { value: 'FIXED1000' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(discountService.validateCode).toHaveBeenCalled();
      expect(mockProps.onDiscountApplied).toHaveBeenCalled();
    });
  });

  test('shows error for invalid discount code', async () => {
    discountService.validateCode.mockResolvedValue({
      valid: false,
      discount: null,
      message: 'Código inválido o expirado'
    });

    render(<DiscountCodeAdvanced {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/ingresa tu código/i);
    const button = screen.getByRole('button', { name: /aplicar/i });

    fireEvent.change(input, { target: { value: 'INVALID' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/código inválido o expirado/i)).toBeInTheDocument();
      expect(mockProps.onDiscountRemoved).toHaveBeenCalled();
    });
  });

  test('shows error when code is empty', () => {
    render(<DiscountCodeAdvanced {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /aplicar/i });
    fireEvent.click(button);

    expect(screen.getByText(/por favor ingresa un código/i)).toBeInTheDocument();
  });

  test('removes applied discount when clicking remove button', async () => {
    const mockDiscount = {
      valid: true,
      discount: {
        code: 'TEST20',
        description: 'Test discount',
        discount_type: 'PERCENTAGE',
        discount_value: 20
      }
    };

    discountService.validateCode.mockResolvedValue(mockDiscount);

    render(<DiscountCodeAdvanced {...mockProps} />);
    
    // Aplicar descuento primero
    const input = screen.getByPlaceholderText(/ingresa tu código/i);
    const applyButton = screen.getByRole('button', { name: /aplicar/i });

    fireEvent.change(input, { target: { value: 'TEST20' } });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText('TEST20')).toBeInTheDocument();
    });

    // Quitar descuento
    const removeButton = screen.getByRole('button', { name: /quitar/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockProps.onDiscountRemoved).toHaveBeenCalled();
      expect(screen.queryByText('TEST20')).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText(/ingresa tu código/i)).toBeInTheDocument();
    });
  });

  test('formats code to uppercase automatically', () => {
    render(<DiscountCodeAdvanced {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/ingresa tu código/i);
    
    fireEvent.change(input, { target: { value: 'test20' } });
    expect(input.value).toBe('TEST20');
    
    fireEvent.change(input, { target: { value: 'Test-20!' } });
    expect(input.value).toBe('TEST20');
  });

  test('re-validates code when order total changes', async () => {
    const mockDiscount = {
      valid: true,
      discount: {
        code: 'TEST20',
        description: 'Test discount',
        discount_type: 'PERCENTAGE',
        discount_value: 20
      }
    };

    discountService.validateCode.mockResolvedValue(mockDiscount);

    const { rerender } = render(<DiscountCodeAdvanced {...mockProps} />);
    
    // Aplicar descuento
    const input = screen.getByPlaceholderText(/ingresa tu código/i);
    const button = screen.getByRole('button', { name: /aplicar/i });

    fireEvent.change(input, { target: { value: 'TEST20' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(discountService.validateCode).toHaveBeenCalledTimes(1);
    });

    // Cambiar el total de la orden
    rerender(<DiscountCodeAdvanced {...mockProps} orderTotal={15000} />);

    await waitFor(() => {
      // Debería re-validar con el nuevo total
      expect(discountService.validateCode).toHaveBeenCalledTimes(2);
      expect(discountService.validateCode).toHaveBeenLastCalledWith(
        'TEST20',
        15000,
        123
      );
    });
  });

  test('handles Enter key press to apply discount', async () => {
    const mockDiscount = {
      valid: true,
      discount: {
        code: 'TEST20',
        description: 'Test discount',
        discount_type: 'PERCENTAGE',
        discount_value: 20
      }
    };

    discountService.validateCode.mockResolvedValue(mockDiscount);

    render(<DiscountCodeAdvanced {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/ingresa tu código/i);
    
    fireEvent.change(input, { target: { value: 'TEST20' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(discountService.validateCode).toHaveBeenCalled();
    });
  });

  test('shows maximum discount message when limit is reached', async () => {
    const mockDiscount = {
      valid: true,
      discount: {
        code: 'LIMIT50',
        description: 'Max discount test',
        discount_type: 'PERCENTAGE',
        discount_value: 50,
        maximum_discount: 2000 // Max $20
      }
    };

    discountService.validateCode.mockResolvedValue(mockDiscount);

    render(<DiscountCodeAdvanced {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/ingresa tu código/i);
    const button = screen.getByRole('button', { name: /aplicar/i });

    fireEvent.change(input, { target: { value: 'LIMIT50' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/descuento máximo aplicado/i)).toBeInTheDocument();
    });
  });
});

describe('DiscountCodeAdvanced - Integration Tests', () => {
  test('full flow: apply, remove, and reapply discount', async () => {
    const mockDiscount = {
      valid: true,
      discount: {
        code: 'FLOW20',
        description: 'Flow test discount',
        discount_type: 'PERCENTAGE',
        discount_value: 20
      }
    };

    discountService.validateCode
      .mockResolvedValueOnce(mockDiscount)
      .mockResolvedValueOnce(mockDiscount);

    const onApplied = jest.fn();
    const onRemoved = jest.fn();

    render(
      <DiscountCodeAdvanced
        orderTotal={10000}
        onDiscountApplied={onApplied}
        onDiscountRemoved={onRemoved}
      />
    );

    const input = screen.getByPlaceholderText(/ingresa tu código/i);
    const applyButton = screen.getByRole('button', { name: /aplicar/i });

    // Aplicar
    fireEvent.change(input, { target: { value: 'FLOW20' } });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(onApplied).toHaveBeenCalledTimes(1);
      expect(screen.getByText('FLOW20')).toBeInTheDocument();
    });

    // Remover
    const removeButton = screen.getByRole('button', { name: /quitar/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(onRemoved).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('FLOW20')).not.toBeInTheDocument();
    });

    // Re-aplicar
    fireEvent.change(input, { target: { value: 'FLOW20' } });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(onApplied).toHaveBeenCalledTimes(2);
      expect(screen.getByText('FLOW20')).toBeInTheDocument();
    });
  });
});
