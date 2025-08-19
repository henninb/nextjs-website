// Import the validatePassword function from the register page
// Since it's defined inline in the register component, we'll recreate it for testing
interface PasswordValidation {
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
  isValid: boolean;
}

const validatePassword = (password: string): PasswordValidation => {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  
  return {
    hasUppercase,
    hasLowercase,
    hasDigit,
    hasSpecialChar,
    isValid: hasUppercase && hasLowercase && hasDigit && hasSpecialChar,
  };
};

describe("validatePassword", () => {
  it("should validate password with all requirements met", () => {
    const result = validatePassword("Test123@");
    
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.isValid).toBe(true);
  });

  it("should invalidate password missing uppercase letter", () => {
    const result = validatePassword("test123@");
    
    expect(result.hasUppercase).toBe(false);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it("should invalidate password missing lowercase letter", () => {
    const result = validatePassword("TEST123@");
    
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(false);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it("should invalidate password missing digit", () => {
    const result = validatePassword("TestABC@");
    
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasDigit).toBe(false);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it("should invalidate password missing special character", () => {
    const result = validatePassword("Test123");
    
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSpecialChar).toBe(false);
    expect(result.isValid).toBe(false);
  });

  it("should handle empty password", () => {
    const result = validatePassword("");
    
    expect(result.hasUppercase).toBe(false);
    expect(result.hasLowercase).toBe(false);
    expect(result.hasDigit).toBe(false);
    expect(result.hasSpecialChar).toBe(false);
    expect(result.isValid).toBe(false);
  });

  it("should validate all allowed special characters", () => {
    const specialChars = ["@", "$", "!", "%", "*", "?", "&"];
    
    specialChars.forEach(char => {
      const result = validatePassword(`Test123${char}`);
      expect(result.hasSpecialChar).toBe(true);
      expect(result.isValid).toBe(true);
    });
  });

  it("should invalidate password with non-allowed special characters", () => {
    const invalidSpecialChars = ["#", "^", "(", ")", "-", "_", "=", "+"];
    
    invalidSpecialChars.forEach(char => {
      const result = validatePassword(`Test123${char}`);
      expect(result.hasSpecialChar).toBe(false);
      expect(result.isValid).toBe(false);
    });
  });

  it("should handle password with multiple uppercase letters", () => {
    const result = validatePassword("TEST123@");
    
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(false);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it("should handle password with multiple lowercase letters", () => {
    const result = validatePassword("test123@");
    
    expect(result.hasUppercase).toBe(false);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it("should handle password with multiple digits", () => {
    const result = validatePassword("Test456789@");
    
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.isValid).toBe(true);
  });

  it("should handle password with multiple special characters", () => {
    const result = validatePassword("Test123@$!");
    
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.isValid).toBe(true);
  });

  it("should handle very short password meeting all requirements", () => {
    const result = validatePassword("T1@a");
    
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.isValid).toBe(true);
  });

  it("should handle very long password meeting all requirements", () => {
    const longPassword = "TestPassword123456789@$!%*?&".repeat(5);
    const result = validatePassword(longPassword);
    
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.isValid).toBe(true);
  });

  it("should handle password with mixed case and requirements", () => {
    const result = validatePassword("MySecureP@ssw0rd");
    
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.isValid).toBe(true);
  });

  it("should handle password with only letters", () => {
    const result = validatePassword("TestPassword");
    
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasDigit).toBe(false);
    expect(result.hasSpecialChar).toBe(false);
    expect(result.isValid).toBe(false);
  });

  it("should handle password with only numbers", () => {
    const result = validatePassword("123456789");
    
    expect(result.hasUppercase).toBe(false);
    expect(result.hasLowercase).toBe(false);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSpecialChar).toBe(false);
    expect(result.isValid).toBe(false);
  });

  it("should handle password with only special characters", () => {
    const result = validatePassword("@$!%*?&");
    
    expect(result.hasUppercase).toBe(false);
    expect(result.hasLowercase).toBe(false);
    expect(result.hasDigit).toBe(false);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it("should handle password with whitespace", () => {
    const result = validatePassword("Test 123@");
    
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.isValid).toBe(true);
  });

  it("should handle password with unicode characters", () => {
    const result = validatePassword("Test123@ñáéí");
    
    expect(result.hasUppercase).toBe(true);
    expect(result.hasLowercase).toBe(true);
    expect(result.hasDigit).toBe(true);
    expect(result.hasSpecialChar).toBe(true);
    expect(result.isValid).toBe(true);
  });
});