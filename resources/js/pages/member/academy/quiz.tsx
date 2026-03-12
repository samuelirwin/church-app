import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

type QuestionData = {
    id: number;
    question: string;
    type: string;
    type_label: string;
    options: string[] | null;
    points: number;
};

type QuizData = {
    id: number;
    title: string;
    description: string | null;
    passing_score: number;
    time_limit_minutes: number | null;
    max_attempts: number | null;
};

type AttemptData = {
    id: number;
    score: number;
    passed: boolean;
    completed_at: string;
};

type Props = {
    quiz: { data: QuizData };
    questions: { data: QuestionData[] };
    attempts: AttemptData[];
    canAttempt: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academy', href: '/academy' },
    { title: 'Quiz', href: '#' },
];

export default function QuizPage({ quiz: { data: quiz }, questions: { data: questions }, attempts, canAttempt }: Props) {
    const [answers, setAnswers] = useState<Record<number, string[]>>({});
    const [submitting, setSubmitting] = useState(false);

    const setAnswer = (questionId: number, value: string[]) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(`/academy/quizzes/${quiz.id}/attempt`, { answers }, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={quiz.title} />

            <div className="mx-auto p-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">{quiz.title}</h1>
                    {quiz.description && <p className="mt-1 text-muted-foreground">{quiz.description}</p>}
                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Passing score: {quiz.passing_score}%</span>
                        {quiz.time_limit_minutes && <span>Time limit: {quiz.time_limit_minutes} min</span>}
                        {quiz.max_attempts && <span>Max attempts: {quiz.max_attempts}</span>}
                    </div>
                </div>

                {/* Previous Attempts */}
                {attempts.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-base">Previous Attempts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {attempts.map((attempt, idx) => (
                                    <div key={attempt.id} className="flex items-center justify-between text-sm">
                                        <span>Attempt {attempts.length - idx}</span>
                                        <div className="flex items-center gap-2">
                                            <span>{attempt.score}%</span>
                                            <Badge variant={attempt.passed ? 'default' : 'secondary'}>
                                                {attempt.passed ? 'Passed' : 'Failed'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quiz Form */}
                {canAttempt ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {questions.map((q, idx) => (
                            <Card key={q.id}>
                                <CardContent className="pt-6">
                                    <p className="mb-3 font-medium">
                                        <span className="mr-2 text-muted-foreground">{idx + 1}.</span>
                                        {q.question}
                                        <span className="ml-2 text-xs text-muted-foreground">({q.points} pt{q.points > 1 ? 's' : ''})</span>
                                    </p>

                                    {q.type === 'multiple_choice' && q.options && (
                                        <div className="space-y-2">
                                            {q.options.map((option) => (
                                                <label key={option} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 hover:bg-muted/30">
                                                    <input
                                                        type="radio"
                                                        name={`q_${q.id}`}
                                                        value={option}
                                                        checked={answers[q.id]?.[0] === option}
                                                        onChange={() => setAnswer(q.id, [option])}
                                                        className="size-4"
                                                    />
                                                    <span className="text-sm">{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === 'true_false' && (
                                        <div className="space-y-2">
                                            {['True', 'False'].map((option) => (
                                                <label key={option} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 hover:bg-muted/30">
                                                    <input
                                                        type="radio"
                                                        name={`q_${q.id}`}
                                                        value={option}
                                                        checked={answers[q.id]?.[0] === option}
                                                        onChange={() => setAnswer(q.id, [option])}
                                                        className="size-4"
                                                    />
                                                    <span className="text-sm">{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === 'short_answer' && (
                                        <input
                                            type="text"
                                            value={answers[q.id]?.[0] ?? ''}
                                            onChange={(e) => setAnswer(q.id, [e.target.value])}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="Type your answer..."
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        ))}

                        <Button type="submit" disabled={submitting} className="w-full">
                            {submitting ? 'Submitting...' : 'Submit Quiz'}
                        </Button>
                    </form>
                ) : (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            You have reached the maximum number of attempts for this quiz.
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
