import { Request } from 'express';


export class RequestModel extends Request {
    user: {
        id: number;
        fullName: string;
    }
}