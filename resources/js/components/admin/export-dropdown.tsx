import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Props = {
    baseUrl: string;
    formats?: ('csv' | 'pdf')[];
};

export function ExportDropdown({ baseUrl, formats = ['csv', 'pdf'] }: Props) {
    const separator = baseUrl.includes('?') ? '&' : '?';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <Download className="mr-1.5 size-4" />
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {formats.includes('csv') && (
                    <DropdownMenuItem asChild>
                        <a href={`${baseUrl}${separator}format=csv`} download>
                            <FileSpreadsheet className="mr-2 size-4" />
                            Export as CSV
                        </a>
                    </DropdownMenuItem>
                )}
                {formats.includes('pdf') && (
                    <DropdownMenuItem asChild>
                        <a href={`${baseUrl}${separator}format=pdf`} download>
                            <FileText className="mr-2 size-4" />
                            Export as PDF
                        </a>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
