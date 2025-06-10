export default interface IUser {
    id: number;
    email: string;
    password: string;
    name: string,
    role: string,
    created_at?: string; 
}
