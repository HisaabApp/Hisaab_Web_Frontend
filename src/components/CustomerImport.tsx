"use client";

import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, X, AlertCircle, ChevronRight, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { customerService } from '@/lib/api/services';

// Fields that can be mapped
const MAPPABLE_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'phone', label: 'Phone Number', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'notes', label: 'Notes', required: false },
];

type ColumnMapping = {
  [key: string]: string; // csvColumn -> fieldKey
};

type ImportRow = {
  [key: string]: string | number | null;
};

type ImportResult = {
  success: number;
  failed: number;
  errors: string[];
};

interface CustomerImportProps {
  onImportComplete?: () => void;
}

export function CustomerImport({ onImportComplete }: CustomerImportProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'importing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ImportRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);

  // Reset state
  const resetState = () => {
    setStep('upload');
    setFile(null);
    setData([]);
    setColumns([]);
    setMapping({});
    setImportResult(null);
    setImportProgress(0);
  };

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    // Check file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const isCSV = uploadedFile.name.endsWith('.csv');
    const isExcel = uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls');

    if (!validTypes.includes(uploadedFile.type) && !isCSV && !isExcel) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV or Excel file',
        variant: 'destructive',
      });
      return;
    }

    setFile(uploadedFile);
    parseFile(uploadedFile);
  }, [toast]);

  // Parse uploaded file
  const parseFile = async (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<ImportRow>(worksheet, { defval: '' });
        
        if (jsonData.length === 0) {
          toast({
            title: 'Empty file',
            description: 'The file contains no data',
            variant: 'destructive',
          });
          return;
        }

        // Get column headers
        const cols = Object.keys(jsonData[0]);
        setColumns(cols);
        setData(jsonData);

        // Auto-map columns based on common names
        const autoMapping: ColumnMapping = {};
        cols.forEach((col) => {
          const colLower = col.toLowerCase().trim();
          if (colLower.includes('name') && !colLower.includes('business')) {
            autoMapping[col] = 'name';
          } else if (colLower.includes('phone') || colLower.includes('mobile') || colLower.includes('contact')) {
            autoMapping[col] = 'phone';
          } else if (colLower.includes('address') || colLower.includes('location')) {
            autoMapping[col] = 'address';
          } else if (colLower.includes('note') || colLower.includes('remark') || colLower.includes('comment')) {
            autoMapping[col] = 'notes';
          }
        });
        setMapping(autoMapping);

        setStep('map');
      } catch (error) {
        console.error('Error parsing file:', error);
        toast({
          title: 'Parse error',
          description: 'Could not read the file. Please check the format.',
          variant: 'destructive',
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Handle column mapping change
  const handleMappingChange = (csvColumn: string, fieldKey: string) => {
    setMapping((prev) => {
      const newMapping = { ...prev };
      
      // Remove any existing mapping to this field
      Object.keys(newMapping).forEach((key) => {
        if (newMapping[key] === fieldKey) {
          delete newMapping[key];
        }
      });

      // Set new mapping (or remove if 'none')
      if (fieldKey === 'none') {
        delete newMapping[csvColumn];
      } else {
        newMapping[csvColumn] = fieldKey;
      }

      return newMapping;
    });
  };

  // Get mapped value for a row
  const getMappedValue = (row: ImportRow, fieldKey: string): string => {
    const csvColumn = Object.keys(mapping).find((col) => mapping[col] === fieldKey);
    if (!csvColumn) return '';
    const value = row[csvColumn];
    return value !== null && value !== undefined ? String(value).trim() : '';
  };

  // Validate mapping - name is required
  const isMappingValid = () => {
    return Object.values(mapping).includes('name');
  };

  // Get preview data (first 5 rows)
  const getPreviewData = () => {
    return data.slice(0, 5).map((row) => ({
      name: getMappedValue(row, 'name'),
      phone: getMappedValue(row, 'phone'),
      address: getMappedValue(row, 'address'),
      notes: getMappedValue(row, 'notes'),
    }));
  };

  // Perform import
  const handleImport = async () => {
    setStep('importing');
    setImportProgress(0);

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    const customers = data.map((row) => ({
      name: getMappedValue(row, 'name'),
      phone: getMappedValue(row, 'phone') || undefined,
      address: getMappedValue(row, 'address') || undefined,
      notes: getMappedValue(row, 'notes') || undefined,
    })).filter((c) => c.name); // Filter out rows without name

    // Import in batches
    const batchSize = 10;
    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);
      
      for (const customer of batch) {
        try {
          await customerService.createCustomer(customer);
          result.success++;
        } catch (error) {
          result.failed++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          if (!result.errors.includes(errorMsg)) {
            result.errors.push(`${customer.name}: ${errorMsg}`);
          }
        }
      }

      // Update progress
      setImportProgress(Math.round(((i + batch.length) / customers.length) * 100));
    }

    setImportResult(result);
    setStep('complete');

    if (result.success > 0) {
      toast({
        title: 'Import complete!',
        description: `Successfully added ${result.success} customer${result.success > 1 ? 's' : ''}`,
      });
      onImportComplete?.();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Customers
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to bulk import customers
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-2">
          {['upload', 'map', 'preview', 'complete'].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1 ${
                step === s ? 'text-primary font-medium' : 
                ['upload', 'map', 'preview', 'importing', 'complete'].indexOf(step) > i ? 'text-muted-foreground' : 'text-muted-foreground/50'
              }`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                  step === s ? 'bg-primary text-primary-foreground' :
                  ['upload', 'map', 'preview', 'importing', 'complete'].indexOf(step) > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {['upload', 'map', 'preview', 'importing', 'complete'].indexOf(step) > i ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span className="text-xs hidden sm:inline capitalize">{s}</span>
              </div>
              {i < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-auto py-4">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Click to upload or drag and drop</p>
                      <p className="text-sm text-muted-foreground">CSV or Excel file (.csv, .xlsx, .xls)</p>
                    </div>
                  </div>
                </label>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>File Format</AlertTitle>
                <AlertDescription>
                  Your file should have columns for customer details like Name, Phone, Address. 
                  You'll map these columns in the next step.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 2: Map Columns */}
          {step === 'map' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{file?.name}</p>
                  <p className="text-sm text-muted-foreground">{data.length} rows found</p>
                </div>
                <Badge variant="outline">{columns.length} columns</Badge>
              </div>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Map Columns</CardTitle>
                  <CardDescription className="text-xs">
                    Match your file columns to customer fields. Name is required.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {columns.map((col) => (
                    <div key={col} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{col}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Sample: {String(data[0]?.[col] || '-').slice(0, 30)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Select
                        value={mapping[col] || 'none'}
                        onValueChange={(value) => handleMappingChange(col, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Don't import</SelectItem>
                          {MAPPABLE_FIELDS.map((field) => (
                            <SelectItem 
                              key={field.key} 
                              value={field.key}
                              disabled={Object.values(mapping).includes(field.key) && mapping[col] !== field.key}
                            >
                              {field.label} {field.required && '*'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {!isMappingValid() && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please map at least the Name column to continue
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Preview (showing first 5 of {data.length} customers)
                </p>
                <Badge>{data.filter((r) => getMappedValue(r, 'name')).length} valid rows</Badge>
              </div>

              <ScrollArea className="h-64 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPreviewData().map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.name || '-'}</TableCell>
                        <TableCell>{row.phone || '-'}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{row.address || '-'}</TableCell>
                        <TableCell className="max-w-[100px] truncate">{row.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>Ready to Import</AlertTitle>
                <AlertDescription>
                  {data.filter((r) => getMappedValue(r, 'name')).length} customers will be added. 
                  Rows without a name will be skipped.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 4: Importing */}
          {step === 'importing' && (
            <div className="space-y-4 py-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <p className="font-medium">Importing customers...</p>
                <p className="text-sm text-muted-foreground">Please don't close this window</p>
              </div>
              <Progress value={importProgress} className="w-full max-w-xs mx-auto" />
              <p className="text-sm text-muted-foreground">{importProgress}% complete</p>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && importResult && (
            <div className="space-y-4">
              <div className="text-center py-4">
                {importResult.success > 0 ? (
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <X className="h-8 w-8 text-red-600" />
                  </div>
                )}
                <h3 className="text-xl font-semibold">Import Complete</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4 text-center">
                    <p className="text-3xl font-bold text-green-600">{importResult.success}</p>
                    <p className="text-sm text-green-700">Imported</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-4 text-center">
                    <p className="text-3xl font-bold text-red-600">{importResult.failed}</p>
                    <p className="text-sm text-red-700">Failed</p>
                  </CardContent>
                </Card>
              </div>

              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Some imports failed</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside text-sm mt-2 max-h-24 overflow-auto">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>...and {importResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 'upload') {
                setIsOpen(false);
              } else if (step === 'complete') {
                setIsOpen(false);
                resetState();
              } else {
                const steps = ['upload', 'map', 'preview'];
                const currentIndex = steps.indexOf(step);
                if (currentIndex > 0) {
                  setStep(steps[currentIndex - 1] as typeof step);
                }
              }
            }}
            disabled={step === 'importing'}
          >
            {step === 'complete' ? 'Close' : step === 'upload' ? 'Cancel' : 'Back'}
          </Button>

          {step !== 'complete' && step !== 'importing' && (
            <Button
              onClick={() => {
                if (step === 'upload') {
                  // Handled by file input
                } else if (step === 'map') {
                  if (isMappingValid()) setStep('preview');
                } else if (step === 'preview') {
                  handleImport();
                }
              }}
              disabled={
                (step === 'map' && !isMappingValid()) ||
                step === 'upload'
              }
            >
              {step === 'preview' ? (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import {data.filter((r) => getMappedValue(r, 'name')).length} Customers
                </>
              ) : (
                'Continue'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
