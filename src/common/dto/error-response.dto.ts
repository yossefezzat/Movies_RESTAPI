export class ErrorResponseDto {
  success: boolean;
  statusCode: number;
  message: string;
  errors: string[];
  timestamp: string;
  path: string;
}
