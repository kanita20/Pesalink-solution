import { useState } from 'react';
import Papa from 'papaparse';

/**
 * Validates a credit card/account number using the Luhn algorithm
 * @param number The account number to validate
 * @returns True if valid, false otherwise
 */
const validateWithLuhn = (number) => {
  try {
    // Clean the input by removing spaces, dashes, etc.
    const cleanedNumber = number.toString().replace(/[\s-]/g, '');
    
    // Check if input contains only digits
    if (!/^\d+$/.test(cleanedNumber)) {
      return false;
    }
    
    // Convert to array of digits
    const digits = cleanedNumber.split('').map(d => parseInt(d, 10));
    
    // Process digits according to Luhn algorithm
    let sum = 0;
    let shouldDouble = false;
    
    // Start from the rightmost digit and move left
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i];
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    // Valid if sum is divisible by 10
    return sum % 10 === 0;
  } catch (error) {
    console.error("Validation error:", error);
    return false;
  }
};

export default function AccountValidator() {
  const [validAccounts, setValidAccounts] = useState([]);
  const [invalidAccounts, setInvalidAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          const valid = [];
          const invalid = [];
          
          // Check for expected column with account numbers
          const firstRow = results.data[0];
          const accountColumn = Object.keys(firstRow).find(
            key => key.toLowerCase().includes('account') || 
                  key.toLowerCase().includes('card') || 
                  key.toLowerCase().includes('number')
          );
          
          if (!accountColumn) {
            throw new Error("Could not find column with account numbers in the CSV");
          }
          
          // Process all rows
          results.data.forEach((row, index) => {
            const accountNumber = row[accountColumn];
            if (!accountNumber) return;
            
            const accountData = { ...row, rowIndex: index + 1 };
            
            if (validateWithLuhn(accountNumber)) {
              valid.push(accountData);
            } else {
              invalid.push(accountData);
            }
          });
          
          setValidAccounts(valid);
          setInvalidAccounts(invalid);
          setIsLoading(false);
        } catch (err) {
          setError(err.message);
          setIsLoading(false);
        }
      },
      error: (err) => {
        setError(`Error parsing CSV: ${err.message}`);
        setIsLoading(false);
      }
    });
  };
  
  const renderAccountTable = (accounts, isValid) => {
    if (!accounts.length) return <p>No {isValid ? 'valid' : 'invalid'} accounts found.</p>;
    
    const headers = Object.keys(accounts[0]).filter(key => key !== 'rowIndex');
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Row</th>
              {headers.map(header => (
                <th key={header} className="p-2 border">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 border">{account.rowIndex}</td>
                {headers.map(header => (
                  <td key={`${index}-${header}`} className="p-2 border">
                    {account[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Account Number Validator</h1>
      
      <div className="mb-8">
        <label className="block mb-2 font-medium">
          Upload CSV file with account numbers:
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full mt-1 p-2 border rounded"
          />
        </label>
        <p className="text-sm text-gray-500 mt-1">
          CSV should contain a column with account/card numbers to validate
        </p>
      </div>
      
      {isLoading && (
        <div className="text-center py-4">
          <p>Processing accounts...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      {!isLoading && !error && (validAccounts.length > 0 || invalidAccounts.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold mb-3 text-green-700">
              Valid Accounts ({validAccounts.length})
            </h2>
            {renderAccountTable(validAccounts, true)}
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-3 text-red-700">
              Invalid Accounts ({invalidAccounts.length})
            </h2>
            {renderAccountTable(invalidAccounts, false)}
          </div>
        </div>
      )}
    </div>
  );
}