export class CLIENTS {
  id!: number;
  client_name!: string;
  current_balance!: number;
}

export class CLIENT_API_COST {
  id!: number;
  vendor_api_id!: number;
  client_id!: number;
  cost!: number;
}
