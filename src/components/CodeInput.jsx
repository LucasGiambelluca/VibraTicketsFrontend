import React, { useRef, useEffect } from 'react';

/**
 * Componente para ingresar código de 6 dígitos
 * Auto-focus entre inputs y validación numérica
 */
export default function CodeInput({ value, onChange, onComplete, disabled = false }) {
  const inputRefs = useRef([]);

  // Auto-focus al primer input cuando el componente monta
  useEffect(() => {
    if (!disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (index, val) => {
    // Solo permitir números
    const digit = val.replace(/\D/g, '');
    if (digit.length > 1) return; // Solo un dígito por input

    const newValue = value.split('');
    newValue[index] = digit;
    const code = newValue.join('');
    
    onChange(code);

    // Auto-focus al siguiente input si hay un valor
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Llamar onComplete si el código está completo
    if (code.length === 6 && !code.includes('')) {
      onComplete?.(code);
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: ir al input anterior si está vacío
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    // Arrow keys para navegación
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length > 0) {
      onChange(digits);
      
      // Focus en el último dígito pegado o el último input
      const focusIndex = Math.min(digits.length - 1, 5);
      inputRefs.current[focusIndex]?.focus();
      
      // Si el código está completo, llamar onComplete
      if (digits.length === 6) {
        onComplete?.(digits);
      }
    }
  };

  return (
    <div style={styles.container}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{
            ...styles.input,
            ...(disabled ? styles.inputDisabled : {}),
            ...(value[index] ? styles.inputFilled : {})
          }}
        />
      ))}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '24px'
  },
  input: {
    width: '50px',
    height: '60px',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    border: '2px solid #d9d9d9',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    backgroundColor: '#fff',
    outline: 'none'
  },
  inputFilled: {
    borderColor: '#667eea',
    backgroundColor: '#f0f5ff'
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    cursor: 'not-allowed',
    opacity: 0.6
  }
};
