
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import ValidationResults from '@/components/ValidationResults';
import PaymentProcessor from '@/components/PaymentProcessor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { PaymentRecord, ValidationResult, validateCSV } from '@/utils/csvUtils';

enum ProcessStep {
  UPLOAD,
  VALIDATE,
  PROCESS,
}

const Index = () => {
  const [currentStep, setCurrentStep] = useState<ProcessStep>(ProcessStep.UPLOAD);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validRecordsForPayment, setValidRecordsForPayment] = useState<PaymentRecord[]>([]);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handleValidate = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a CSV file first');
      return;
    }

    setIsValidating(true);

    try {
      const formData =new FormData()
      formData.set("file", uploadedFile)

      const res = await fetch("http://127.0.0.1:3000/upload", {
        method: "POST",
        body: formData
      })

      const results = await res.json()
      setValidationResults({
        valid: results.valid,
        invalid: results.invalid,
        summary: {
          totalAmount: 0,
          totalRecords: 1000,
          validAmount: 0,
          validCount: results.valid.length,
          invalidCount: results.invalid.length
        }
      });
      setCurrentStep(ProcessStep.VALIDATE);
      
      if (results.valid.length === 0) {
        toast.error('No valid records found in the CSV file');
      } else if (results.invalid.length === 0) {
        toast.success('All records are valid and ready for processing');
      } else {
        toast.warning(`${results.invalid.length} invalid records found. Please review.`);
      }
    } catch (error) {
      console.error(error);
      toast.error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleProceed = (validRecords: PaymentRecord[]) => {
    setValidRecordsForPayment(validRecords);
    setCurrentStep(ProcessStep.PROCESS);
  };

  const handleRevalidate = () => {
    setCurrentStep(ProcessStep.UPLOAD);
    setUploadedFile(null);
    setValidationResults(null);
  };

  const handleBack = () => {
    setCurrentStep(ProcessStep.VALIDATE);
  };

  const handleComplete = () => {
    setCurrentStep(ProcessStep.UPLOAD);
    setUploadedFile(null);
    setValidationResults(null);
    setValidRecordsForPayment([]);
    toast.success('Transaction process completed. You can now start a new batch.');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case ProcessStep.UPLOAD:
        return (
          <div className="space-y-6">
            <FileUpload onFileUpload={handleFileUpload} />
            
            <div className="flex justify-end">
              <Button 
                onClick={handleValidate} 
                disabled={!uploadedFile || isValidating}
                className="bg-pesalink-primary hover:bg-pesalink-primary/90"
              >
                {isValidating ? 'Validating...' : 'Validate Transactions'}
              </Button>
            </div>
          </div>
        );
      
      case ProcessStep.VALIDATE:
        return validationResults && (
          <ValidationResults 
            results={validationResults} 
            onProceed={handleProceed}
            onRevalidate={handleRevalidate}
          />
        );
        
      case ProcessStep.PROCESS:
        return (
          <PaymentProcessor 
            validRecords={validRecordsForPayment}
            onBack={handleBack}
            onComplete={handleComplete}
          />
        );
        
      default:
        return null;
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center mb-8">
        <StepItem 
          number={1} 
          title="Upload CSV" 
          isActive={currentStep === ProcessStep.UPLOAD}
          isCompleted={currentStep > ProcessStep.UPLOAD}
        />
        <StepDivider isActive={currentStep > ProcessStep.UPLOAD} />
        <StepItem 
          number={2} 
          title="Validate Records" 
          isActive={currentStep === ProcessStep.VALIDATE}
          isCompleted={currentStep > ProcessStep.VALIDATE}
        />
        <StepDivider isActive={currentStep > ProcessStep.VALIDATE} />
        <StepItem 
          number={3} 
          title="Process Payments" 
          isActive={currentStep === ProcessStep.PROCESS}
          isCompleted={false}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="container py-8 flex-1">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-pesalink-primary mb-2">Bulk Payment Transactions</h1>
            <p className="text-gray-500">Upload, validate and process multiple payments at once</p>
          </header>
          
          {renderStepIndicator()}
          
          <Card className="p-6">
            {renderStepContent()}
          </Card>
        </div>
      </div>
      
      <footer className="border-t py-4 bg-white">
        <div className="container">
          <div className="text-sm text-center text-gray-500">
            &copy; 2025 PesaLink Batch Buddy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

const StepItem = ({ 
  number, 
  title, 
  isActive, 
  isCompleted 
}: { 
  number: number; 
  title: string; 
  isActive: boolean; 
  isCompleted: boolean;
}) => {
  let bgColor = 'bg-gray-200';
  let textColor = 'text-gray-700';
  
  if (isActive) {
    bgColor = 'bg-pesalink-primary';
    textColor = 'text-white';
  } else if (isCompleted) {
    bgColor = 'bg-pesalink-success';
    textColor = 'text-white';
  }
  
  return (
    <div className="flex items-center">
      <div className={`rounded-full h-8 w-8 flex items-center justify-center ${bgColor} ${textColor}`}>
        {isCompleted ? <span>✓</span> : number}
      </div>
      <span className={`ml-2 ${isActive ? 'font-medium text-pesalink-primary' : 'text-gray-500'}`}>{title}</span>
    </div>
  );
};

const StepDivider = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className={`h-1 w-16 mx-2 ${isActive ? 'bg-pesalink-success' : 'bg-gray-200'}`}></div>
  );
};

export default Index;
