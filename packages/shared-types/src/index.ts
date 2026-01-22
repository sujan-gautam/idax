export interface Tenant {
    id: string;
    name: string;
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
}

export interface User {
    id: string;
    email: string;
    tenantId: string;
    role: 'ADMIN' | 'USER';
}
