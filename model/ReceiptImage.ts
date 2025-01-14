import { ImageFormatType } from "./ImageFormatType";

export default interface ReceiptImage {
  receiptImageId: number;
  transactionId: number;
  activeStatus: boolean;
  imageFormatType: ImageFormatType;
  image: string;
  thumbnail: string;
}
