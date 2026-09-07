export interface BkashCreateResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  bkashURL: string;
  customerMsisdn?: string;
  amount?: string;
  intent?: string;
  merchantInvoiceNumber?: string;
}

export interface BkashExecuteResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  trxID?: string;
  amount?: string;
  transactionStatus?: string;
  paymentExecuteTime?: string;
  currency?: string;
  intent?: string;
  merchantInvoiceNumber?: string;
}

export interface BkashCallbackQuery {
  paymentID?: string;
  status?: 'success' | 'failure' | 'cancel';
  format?: string;
}
