export class CLIENT_TRSACTIONS {
  id!: number;
  client_id!: number;
  amount!: number;
  transaction_note!: string;
  type!: "D" | "C";
  transaction_date!: string;
}

export class VENDOR_TRANSACTIONS {
  id!: number;
  vendor_id!: number;
  amount!: number;
  transaction_note!: string;
  type!: "D" | "C";
  transaction_date!: string;
}
