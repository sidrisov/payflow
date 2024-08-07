export interface StorageUsage {
  total_active_units: number;
  soon_expire_units: number;
  casts: Storage;
  reactions: Storage;
  links: Storage;
  verifications: Capacity;
  usernameProofs: Capacity;
  signers: Capacity;
}

export interface Storage {
  object: string;
  used: number;
  capacity: number;
}

export interface Capacity {
  used: number;
  capacity: number;
}
