
import React, { useState } from 'react';
import { TabsList, TabsTrigger, Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaymentRecord, ValidationResult, formatCurrency } from '@/utils/csvUtils';
import { Check, X, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea';
import { createPrompt } from '@/utils/gemini';
import Markdown from 'react-markdown'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EllipsisVertical, Sparkles } from "lucide-react"

interface ValidationResultsProps {
  results: ValidationResult;
  onProceed: (validRecords: PaymentRecord[]) => void;
  onRevalidate: () => void;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({
  results,
  onProceed,
  onRevalidate
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [responses, setResponses] = useState<{ sender: string; message: string }[]>([])

  const handleAskAi = async (issue: string) => {
    try {
      // Call your AI or prompt function here
      const aiResponse = await createPrompt(issue) // make sure this returns a string or structured message

      // Update the responses state with both the user question and AI answer
      setResponses((prevResponses) => [
        ...prevResponses,
        { sender: 'user', message: issue },
        { sender: 'ai', message: aiResponse }
      ])
    } catch (error) {
      console.error('AI request failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="valid">Valid Records ({results.valid.length})</TabsTrigger>
          <TabsTrigger value="invalid">Invalid Records ({results.invalid.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation Summary</CardTitle>
              <CardDescription>
                Overview of the validation results for your CSV file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                  title="Total Records"
                  value={results.summary.totalRecords}
                />
                <SummaryCard
                  title="Valid Records"
                  value={results.summary.validCount}
                  status="success"
                  percentage={
                    (results.summary.validCount / results.summary.totalRecords) * 100
                  }
                />
                <SummaryCard
                  title="Invalid Records"
                  value={results.summary.invalidCount}
                  status="error"
                  percentage={
                    (results.summary.invalidCount / results.summary.totalRecords) * 100
                  }
                />
              </div>

            </CardContent>
            <CardFooter className="flex justify-between">
              {results.valid.length > 0 && (
                <Button
                  onClick={() => onProceed(results.valid)}
                  className="bg-pesalink-primary hover:bg-pesalink-primary/90"
                >
                  Proceed with Valid Transactions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              {results.invalid.length > 0 && (
                <Button variant="outline" onClick={onRevalidate}>
                  Revalidate
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="valid">
          <Card>
            <CardHeader>
              <CardTitle>Valid Records</CardTitle>
              <CardDescription>
                These records passed all validation checks and are ready for processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Bank Name</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.valid.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono">{record.accountNumber.slice(0,12) + '...' + record.accountNumber.slice(record.accountNumber.length - 12,record.accountNumber.length)}</TableCell>
                        <TableCell>{record?.accountHolderName}</TableCell>
                        <TableCell>{record?.bankName}</TableCell>
                        <TableCell>{record?.currency}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-pesalink-success border-pesalink-success">
                            <Check className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              {results.valid.length > 0 && (
                <Button
                  onClick={() => onProceed(results.valid)}
                  className="bg-pesalink-primary hover:bg-pesalink-primary/90"
                >
                  Proceed with Payments
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="invalid">
          <Card>
            <CardHeader>
              <CardTitle>Invalid Records</CardTitle>
              <CardDescription>
                These records failed validation and need correction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Bank Code</TableHead>
                      <TableHead>Bank Name</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.invalid.map((item, index: number) => (
                      <TableRow key={`invalid-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-mono">{item?.accountNumber.toString().slice(0,12) + '...' + item?.accountNumber.toString().slice(item.accountNumber.toString().length - 12,item?.accountNumber.toString().length) || '-'}</TableCell>
                        <TableCell>{item?.accountHolderName || '-'}</TableCell>
                        <TableCell>{item?.bankCode || '-'}</TableCell>
                        <TableCell>{item?.bankName || '-'}</TableCell>
                        <TableCell>{item?.currency || '-'}</TableCell>
                        <TableCell>{item?.status || '-'}</TableCell>
                        <TableCell>
                        <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" className='w-full'><Sparkles /> Ask BuddyAI</Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[600px] ">
                                      <DialogHeader>
                                        <DialogTitle>Ask BuddyAI</DialogTitle>
                                        <DialogDescription>
                                          Let BuddyAI help in troubleshooting the system issues
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4 overflow-y-auto max-h-[300px]">
                                        <ul>
                                          {responses.length > 0 && responses.map((response, index) => (
                                            <li key={index} style={{
                                              textAlign: response.sender === 'user' ? 'right' : 'left',
                                              background: response.sender === 'user' ? '#e0f7fa' : '#f1f8e9',
                                              margin: '5px 0',
                                              padding: '10px',
                                              borderRadius: '8px',
                                              listStyle: 'none'
                                            }}>
                                              <strong>{response.sender === 'user' ? 'You' : 'BuddyAI'}:</strong>
                                              <div><Markdown>{response.message}</Markdown></div>
                                            </li>
                                          ))}
                                        </ul>

                                        
                                      </div>
                                      <DialogFooter className='sticky flex items-center'>
                                        <Textarea
                                            placeholder="What can I help you"
                                            defaultValue={`What is wrong with the following account: ${JSON.stringify(item)}`}
                                            minLength={5}
                                          />
                                        <Button onClick={() => handleAskAi(JSON.stringify(item))}>Submit</Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>

                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={onRevalidate} className="ml-auto">
                Upload New File
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  status,
  percentage
}: {
  title: string;
  value: number;
  status?: 'success' | 'error';
  percentage?: number;
}) => {
  let bgColor = 'bg-gray-50';
  let textColor = 'text-gray-900';

  if (status === 'success') {
    bgColor = 'bg-green-50';
    textColor = 'text-pesalink-success';
  } else if (status === 'error') {
    bgColor = 'bg-red-50';
    textColor = 'text-pesalink-error';
  }

  return (
    <div className={`${bgColor} p-4 rounded-md`}>
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`text-2xl font-semibold ${textColor}`}>{value}</div>
      {percentage !== undefined && (
        <div className="text-sm mt-1">
          {percentage.toFixed(1)}% of total
        </div>
      )}
    </div>
  );
};

export default ValidationResults;
