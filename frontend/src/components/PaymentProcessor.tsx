
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PaymentRecord, formatCurrency, processPayments } from '@/utils/csvUtils';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface PaymentProcessorProps {
  validRecords: PaymentRecord[];
  onBack: () => void;
  onComplete: () => void;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  validRecords,
  onBack,
  onComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processedResults, setProcessedResults] = useState<{
    successful: PaymentRecord[];
    failed: Array<{ record: PaymentRecord; reason: string }>;
  } | null>(null);
  
  const totalAmount = validRecords.reduce((sum, record) => sum + record.amount, 0);
  
  const handleProcess = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        return newProgress < 90 ? newProgress : 90;
      });
    }, 300);
    
    try {
      const results = await processPayments(validRecords);
      
      // Set to 100% when complete
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      setProcessedResults(results);
      
      if (results.failed.length === 0) {
        toast.success('All payments processed successfully!');
      } else {
        toast.warning(`${results.failed.length} payment(s) failed. Please review the results.`);
      }
    } catch (error) {
      toast.error('An error occurred during payment processing.');
      console.error(error);
      clearInterval(progressInterval);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Processing</CardTitle>
          <CardDescription>
            {processedResults
              ? 'Review the results of your payment processing'
              : 'Review and confirm the payments to be processed'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="space-y-4 py-8">
              <div className="text-center">
                <h3 className="text-xl font-medium mb-2">Processing Payments</h3>
                <p className="text-gray-500 mb-6">
                  Please wait while we process your transactions...
                </p>
              </div>
              
              <Progress value={processingProgress} className="h-2 w-full" />
              
              <p className="text-center text-sm text-gray-500">
                Processing {validRecords.length} transactions • {processingProgress.toFixed(0)}% complete
              </p>
            </div>
          ) : processedResults ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-pesalink-light p-4 rounded-md">
                  <div className="text-sm text-gray-500">Successful Transactions</div>
                  <div className="text-2xl font-semibold text-pesalink-success">
                    {processedResults.successful.length}
                  </div>
                  <div className="text-sm mt-1">
                    {((processedResults.successful.length / validRecords.length) * 100).toFixed(1)}% of total
                  </div>
                </div>
                <div className="bg-pesalink-light p-4 rounded-md">
                  <div className="text-sm text-gray-500">Failed Transactions</div>
                  <div className="text-2xl font-semibold text-pesalink-error">
                    {processedResults.failed.length}
                  </div>
                  <div className="text-sm mt-1">
                    {((processedResults.failed.length / validRecords.length) * 100).toFixed(1)}% of total
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedResults.successful.map((record) => (
                      <TableRow key={`success-${record.id}`}>
                        <TableCell className="font-mono">{record.accountNumber.slice(0,12) + '...' + record.accountNumber.slice(record.accountNumber.length - 12,record.accountNumber.length)}</TableCell>
                        <TableCell>{record.accountHolderName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-pesalink-success border-pesalink-success">
                            <Check className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        </TableCell>
                        <TableCell className="text-pesalink-success">Payment completed</TableCell>
                      </TableRow>
                    ))}
                    {processedResults.failed.map(({ record, reason }) => (
                      <TableRow key={`failed-${record.id}`}>
                        <TableCell className="font-mono">{record.accountNumber}</TableCell>
                        <TableCell>{record.accountName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(record.amount)}</TableCell>
                        <TableCell>{record.reference}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-50 text-pesalink-error border-pesalink-error">
                            <X className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        </TableCell>
                        <TableCell className="text-pesalink-error">{reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <>
              <div className="bg-pesalink-light p-4 rounded-md mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">Number of Transactions</div>
                    <div className="text-2xl font-semibold">{validRecords.length}</div>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Bank Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono">{record.accountNumber}</TableCell>
                        <TableCell>{record.accountHolderName}</TableCell>
                        <TableCell>{record.bankCode}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {processedResults ? (
            <>
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Validation
              </Button>
              <Button onClick={onComplete}>
                Complete
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Validation
              </Button>
              <Button 
                onClick={handleProcess}
                disabled={isProcessing}
                className="bg-pesalink-primary hover:bg-pesalink-primary/90"
              >
                Process Payments
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentProcessor;
