import IUser from "types/IUser";
type TAdmin = Omit<IUser, 'id'>;
export const admin: TAdmin = {
    email: 'admin@gmail.com',
    password: 'admin',
    name: 'admin',
    role: 'admin'
};