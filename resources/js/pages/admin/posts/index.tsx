import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, StickyNote, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    DataTable,
    type DataTableColumn,
    type SortDirection,
} from '@/components/shared/data-table/data-table';
import { FacetedFilter } from '@/components/shared/data-table/faceted-filter';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/confirm';
import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/members';

type PostData = {
    id: number;
    title: string;
    slug: string;
    is_published: boolean;
    is_featured: boolean;
    author: { id: number; name: string } | null;
    category: { id: number; name: string } | null;
    published_at: string | null;
};

type Filters = {
    search?: string;
    category_id: string[];
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    posts: Paginated<PostData>;
    filters: Filters;
    categories: Array<{ id: number; name: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/posts' },
    { title: 'Posts', href: '/admin/posts' },
];

const getRowId = (post: PostData) => String(post.id);

const deletePost = async (post: PostData) => {
    if (
        await confirmAction({
            title: `Delete post "${post.title}"?`,
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/posts/${post.id}`);
    }
};

export default function PostsIndex({ posts, filters, categories }: Props) {
    const { permissions } = usePage().props as {
        permissions: { isStaffOrAbove: boolean };
    };
    const canManage = permissions.isStaffOrAbove;
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/posts',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const columns = useMemo<DataTableColumn<PostData>[]>(
        () => [
            {
                id: 'title',
                accessorFn: (post) => post.title,
                header: 'Title',
                enableHiding: false,
                cell: ({ row }) => (
                    <span className="font-medium">{row.original.title}</span>
                ),
            },
            {
                id: 'author',
                header: 'Author',
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.author?.name ?? '—'}
                    </span>
                ),
            },
            {
                id: 'category',
                header: 'Category',
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.category?.name ?? '—'}
                    </span>
                ),
            },
            {
                id: 'status',
                accessorFn: (post) => post.is_published,
                header: 'Status',
                cell: ({ row }) => (
                    <div className="flex gap-1">
                        <Badge
                            variant={
                                row.original.is_published
                                    ? 'default'
                                    : 'secondary'
                            }
                        >
                            {row.original.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {row.original.is_featured && (
                            <Badge variant="outline">Featured</Badge>
                        )}
                    </div>
                ),
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">Actions</span>,
                enableHiding: false,
                cell: ({ row }) =>
                    canManage && (
                        <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild>
                                <Link
                                    href={`/admin/posts/${row.original.id}/edit`}
                                    aria-label={`Edit ${row.original.title}`}
                                >
                                    <Pencil className="size-3.5" />
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deletePost(row.original)}
                                className="text-destructive hover:text-destructive"
                                aria-label={`Delete ${row.original.title}`}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    ),
            },
        ],
        [canManage],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Posts" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Posts</h1>
                    {canManage && (
                        <Button asChild>
                            <Link href="/admin/posts/create">
                                <Plus className="mr-1 size-4" />
                                Add Post
                            </Link>
                        </Button>
                    )}
                </div>

                <DataTable
                    data={posts.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-posts"
                    meta={posts.meta}
                    itemLabel="posts"
                    empty={
                        <EmptyState
                            icon={StickyNote}
                            title="No posts found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <>
                            <Input
                                placeholder="Search posts..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    applyFilters({
                                        search: e.target.value || undefined,
                                    });
                                }}
                                className="h-9 sm:max-w-xs"
                            />
                            <FacetedFilter
                                title="Category"
                                options={categories.map((c) => ({
                                    value: String(c.id),
                                    label: c.name,
                                }))}
                                selected={filters.category_id}
                                onChange={(category_id) =>
                                    applyFilters({ category_id })
                                }
                            />
                        </>
                    }
                />
            </div>
        </AppLayout>
    );
}
