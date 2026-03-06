import { Download, FileSpreadsheet, FileText, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type DocumentPreviewProps = {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    isPdf: boolean;
    isImage: boolean;
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
        return <FileSpreadsheet className="size-12 text-green-600" />;
    }
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
        return <Presentation className="size-12 text-orange-600" />;
    }
    return <FileText className="size-12 text-blue-600" />;
}

export function DocumentPreview({ fileUrl, fileName, fileSize, mimeType, isPdf, isImage }: DocumentPreviewProps) {
    if (isPdf) {
        return (
            <div className="space-y-3">
                <iframe
                    src={fileUrl}
                    className="h-[600px] w-full rounded-lg border border-border"
                    title={fileName}
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{fileName} ({formatFileSize(fileSize)})</span>
                    <Button variant="outline" size="sm" asChild>
                        <a href={fileUrl} download>
                            <Download className="mr-1 size-3.5" />
                            Download
                        </a>
                    </Button>
                </div>
            </div>
        );
    }

    if (isImage) {
        return (
            <div className="space-y-3">
                <div className="flex justify-center rounded-lg border border-border bg-muted/30 p-4">
                    <img src={fileUrl} alt={fileName} className="max-h-[600px] rounded object-contain" />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{fileName} ({formatFileSize(fileSize)})</span>
                    <Button variant="outline" size="sm" asChild>
                        <a href={fileUrl} download>
                            <Download className="mr-1 size-3.5" />
                            Download
                        </a>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Card>
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                {getFileIcon(mimeType)}
                <div>
                    <p className="font-medium">{fileName}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(fileSize)}</p>
                </div>
                <Button asChild>
                    <a href={fileUrl} download>
                        <Download className="mr-1.5 size-4" />
                        Download File
                    </a>
                </Button>
            </CardContent>
        </Card>
    );
}
