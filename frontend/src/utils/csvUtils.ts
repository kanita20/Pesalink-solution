
export interface PaymentRecord {
  id: string;
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  description?: string;
}

export interface ValidationResult {
  valid: PaymentRecord[];
  invalid: Array<{
    record: Partial<PaymentRecord>;
    errors: string[];
    rowIndex: number;
    accountNumber: number;
    bankCode: number
  }>;
  summary: {
    totalRecords: number;
    validCount: number;
    invalidCount: number;
    totalAmount: number;
    validAmount: number;
  };
}

const REQUIRED_HEADERS = [
  'accountNumber',
  // 'accountName',
  'bankCode',
  // 'amount',
  // 'reference'
];

export const parseCSV = (csvContent: string): string[][] => {
  const rows = csvContent.split(/\r?\n/).filter(row => row.trim() !== '');
  return rows.map(row => {
    // Handle quoted cells that may contain commas
    const result = [];
    let inQuote = false;
    let currentValue = '';
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        result.push(currentValue.replace(/^"|"$/g, ''));
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    result.push(currentValue.replace(/^"|"$/g, ''));
    return result;
  });
};

export const validateCSV = (file: File): Promise<ValidationResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvContent = event.target?.result as string;
        const rows = parseCSV(csvContent);
        
        if (rows.length < 2) {
          reject(new Error('CSV file must contain headers and at least one data row'));
          return;
        }
        
        const headers = rows[0].map(header => 
          header.toLowerCase().trim().replace(/\s+/g, '')
        );
        
        // Check for required headers
        const missingHeaders = REQUIRED_HEADERS.filter(
          required => !headers.includes(required.toLowerCase())
        );
        
        if (missingHeaders.length > 0) {
          reject(new Error(`Missing required headers: ${missingHeaders.join(', ')}`));
          return;
        }
        
        const valid: PaymentRecord[] = [];
        const invalid: ValidationResult['invalid'] = [];
        let totalAmount = 0;
        let validAmount = 0;
        
        // Process data rows
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const record: Partial<PaymentRecord> = {};
          const errors: string[] = [];
          
          // Map CSV values to record properties
          headers.forEach((header, index) => {
            if (index < row.length) {
              // Here we need to handle the type conversion properly
              if (header === 'amount') {
                const parsedAmount = parseFloat(row[index].trim());
                if (!isNaN(parsedAmount)) {
                  record[header] = parsedAmount;
                } else {
                  record[header] = row[index].trim();
                }
              } else {
                // @ts-ignore - Dynamic property assignment
                record[header] = row[index].trim();
              }
            }
          });
          
          // Generate an ID for the record
          record.id = `tr-${Date.now()}-${i}`;
          
          // Validate account number
          if (!record.accountNumber) {
            errors.push('Account number is required');
          } else if (!/^\d{10,16}$/.test(record.accountNumber)) {
            errors.push('Account number must be 10-16 digits');
          }
          
          
          // Validate bank code
          if (!record.bankCode) {
            errors.push('Bank code is required');
          } else if (!/^\d{3,6}$/.test(record.bankCode)) {
            errors.push('Invalid bank code format');
          }
          
          // Validate amount
          if (!record.amount) {
            errors.push('Amount is required');
          } else {
            // Fixed: Ensure amount is properly typed
            const parsedAmount = typeof record.amount === 'number' 
              ? record.amount 
              : parseFloat(String(record.amount));
              
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
              errors.push('Amount must be a positive number');
            } else {
              record.amount = parsedAmount;
              totalAmount += parsedAmount;
              
              if (errors.length === 0) {
                validAmount += parsedAmount;
              }
            }
          }
        
          
          if (errors.length === 0) {
            valid.push(record as PaymentRecord);
          } else {
            invalid.push({
              record,
              errors,
              rowIndex: i
            });
          }
        }
        
        resolve({
          valid,
          invalid,
          summary: {
            totalRecords: rows.length - 1,
            validCount: valid.length,
            invalidCount: invalid.length,
            totalAmount,
            validAmount
          }
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the CSV file'));
    };
    
    reader.readAsText(file);
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2
  }).format(amount);
};

// Mock function to simulate actual payment API request
export const processPayments = (validRecords: PaymentRecord[]): Promise<{
  successful: PaymentRecord[];
  failed: Array<{ record: PaymentRecord; reason: string }>;
}> => {
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      // For simulation purposes, assume 95% of records succeed
      const successful: PaymentRecord[] = [];
      const failed: Array<{ record: PaymentRecord; reason: string }> = [];
      
      validRecords.forEach(record => {
        if (Math.random() > 0.05) {
          successful.push(record);
        } else {
          failed.push({
            record,
            reason: 'Transaction timeout. Please try again.'
          });
        }
      });
      
      resolve({ successful, failed });
    }, 2000);
  });
};
