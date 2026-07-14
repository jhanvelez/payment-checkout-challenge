export interface CustomerProps {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  createdAt: Date;
}

export class Customer {
  constructor(private readonly props: CustomerProps) {}

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
