import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    CalendarDays,
    GraduationCap,
    Heart,
    Library,
    MapPin,
    Mic2,
    Newspaper,
    Users,
} from 'lucide-react';
import { HeroCarousel } from '@/components/hero-carousel';
import PublicLayout from '@/layouts/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Sermon = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    sermon_date: string | null;
    speaker: { id: number; name: string } | null;
    is_current_week: boolean;
};

type Highlight = {
    id: number;
    title: string;
    slug: string;
    body: string | null;
    type: string;
    type_label: string;
    cover_url: string | null;
};

type Post = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    author: { id: number; name: string } | null;
    published_at: string | null;
};

type Course = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    difficulty: string | null;
    difficulty_label: string | null;
};

type UpcomingEvent = {
    id: number;
    title: string;
    slug: string;
    starts_at: string;
    location: string | null;
};

type HeroSlideData = {
    id: number;
    image_url: string;
    title?: string | null;
    subtitle?: string | null;
    link_url?: string | null;
    link_text?: string | null;
};

type WelcomeProps = {
    heroSlides: HeroSlideData[];
    canRegister?: boolean;
    currentSermon: Sermon | null;
    highlights: { data: Highlight[] };
    recentPosts: { data: Post[] };
    featuredCourses: { data: Course[] };
    upcomingEvents: { data: UpcomingEvent[] };
};

function formatTime(time: string | null): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return minutes === 0 ? `${displayHours}:00 ${period}` : `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

export default function Welcome({
    heroSlides,
    canRegister = true,
    currentSermon,
    highlights,
    recentPosts,
    featuredCourses,
    upcomingEvents,
}: WelcomeProps) {
    const { serviceTimes, siteSettings } = usePage().props;
    const heroTagline = siteSettings.general.hero_tagline || 'Join us this Sunday';
    const heroHeading = siteSettings.general.hero_heading || 'Welcome Home';
    const heroSubheading = siteSettings.general.hero_subheading || 'A place where faith grows, community thrives, and everyone belongs.';

    return (
        <PublicLayout>
            <Head title="Welcome">
                <meta name="description" content={heroSubheading} />
                <meta property="og:title" content={heroHeading} />
                <meta property="og:description" content={heroSubheading} />
                <meta property="og:type" content="website" />
            </Head>

            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {heroSlides.length > 0 ? (
                    <HeroCarousel slides={heroSlides} />
                ) : (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-b from-golden/[0.04] via-transparent to-warm-cream/40" />
                        <div className="absolute -top-32 right-0 size-[600px] rounded-full bg-golden/[0.05] blur-[120px]" />
                        <div className="absolute -bottom-32 -left-20 size-[500px] rounded-full bg-bronze/[0.04] blur-[100px]" />
                    </>
                )}

                <div className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-20 text-center sm:pb-24 sm:pt-28 lg:pb-28 lg:pt-36">
                    {heroTagline && (
                        <p className={`text-sm font-medium uppercase tracking-[0.2em] ${heroSlides.length > 0 ? 'text-golden' : 'text-bronze'}`}>
                            {heroTagline}
                        </p>
                    )}
                    {heroHeading && (
                        <h1 className={`mt-6 font-heading text-5xl font-bold tracking-[-0.02em] sm:text-6xl lg:text-7xl ${heroSlides.length > 0 ? 'text-white' : 'text-foreground'}`}>
                            {heroHeading}
                        </h1>
                    )}
                    {heroSubheading && (
                        <p className={`mx-auto mt-8 max-w-xl text-lg leading-relaxed sm:text-xl ${heroSlides.length > 0 ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {heroSubheading}
                        </p>
                    )}
                    <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Button size="lg" className="bg-bronze text-white shadow-lg shadow-bronze/20 hover:bg-bronze/90" asChild>
                            <Link href="/visit">
                                Plan Your Visit
                                <ArrowRight className="ml-2 size-4" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className={heroSlides.length > 0 ? 'border-white bg-white/10 text-white hover:bg-white hover:text-earth-dark' : ''} asChild>
                            <Link href="/sermons">
                                Watch Sermons
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Service Times Bar */}
            {serviceTimes.length > 0 && (
                <section className="border-y border-earth-light/10 bg-earth-dark">
                    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-4 py-4 sm:px-6 lg:px-8">
                        {serviceTimes.map((st, index) => (
                            <div key={st.id} className="flex items-center gap-3 text-sm">
                                {index > 0 && (
                                    <span className="mr-3 hidden text-earth-light/20 sm:inline">|</span>
                                )}
                                <span className="font-medium text-golden">{st.name}</span>
                                <span className="text-earth-light/70">
                                    {st.start_time && st.end_time
                                        ? `${formatTime(st.start_time)} \u2013 ${formatTime(st.end_time)}`
                                        : st.start_time
                                          ? formatTime(st.start_time)
                                          : '\u2013'}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Current Sermon Spotlight */}
            {currentSermon && (
                <section className="bg-warm-cream/40">
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-bronze">
                            {currentSermon.is_current_week ? "This Week\u2019s Message" : 'Latest Message'}
                        </p>
                        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                            <div className="min-w-0 flex-1">
                                <h2 className="font-heading text-3xl font-bold tracking-[-0.01em] sm:text-4xl">
                                    {currentSermon.title}
                                </h2>
                                <p className="mt-3 text-muted-foreground">
                                    {currentSermon.speaker?.name}
                                    {currentSermon.sermon_date && ` \u00B7 ${currentSermon.sermon_date}`}
                                </p>
                                {currentSermon.description && (
                                    <p className="mt-3 line-clamp-2 max-w-2xl text-muted-foreground">
                                        {currentSermon.description}
                                    </p>
                                )}
                            </div>
                            <Button size="lg" className="shrink-0" asChild>
                                <Link href={`/sermons/${currentSermon.slug}`}>
                                    Watch Now
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            {/* Active Highlights */}
            {highlights.data.length > 0 && (
                <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mb-8 flex items-end justify-between">
                        <h2 className="font-heading text-3xl font-bold tracking-[-0.01em]">Highlights</h2>
                        <Button variant="ghost" size="sm" className="text-bronze hover:text-bronze/80" asChild>
                            <Link href="/highlights">
                                View All
                                <ArrowRight className="ml-1 size-4" />
                            </Link>
                        </Button>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {highlights.data.map((highlight) => (
                            <Card key={highlight.id} className="group border-border/50 bg-card transition-all duration-300 hover:border-bronze/30 hover:shadow-lg hover:shadow-bronze/5">
                                <CardHeader>
                                    <Badge variant="secondary" className="w-fit bg-golden/10 text-bronze">
                                        {highlight.type_label}
                                    </Badge>
                                    <CardTitle className="mt-2 line-clamp-2">{highlight.title}</CardTitle>
                                </CardHeader>
                                {highlight.body && (
                                    <CardContent>
                                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{highlight.body}</p>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Recent Updates */}
            {recentPosts.data.length > 0 && (
                <section className="bg-warm-cream/40">
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="mb-8 flex items-end justify-between">
                            <h2 className="font-heading text-3xl font-bold tracking-[-0.01em]">Recent Updates</h2>
                            <Button variant="ghost" size="sm" className="text-bronze hover:text-bronze/80" asChild>
                                <Link href="/updates">
                                    View All
                                    <ArrowRight className="ml-1 size-4" />
                                </Link>
                            </Button>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            {recentPosts.data.map((post) => (
                                <Card key={post.id} className="group border-border/50 bg-card transition-all duration-300 hover:border-bronze/30 hover:shadow-lg hover:shadow-bronze/5">
                                    <CardHeader>
                                        <CardTitle className="line-clamp-2">
                                            <Link href={`/updates/${post.slug}`} className="transition-colors hover:text-bronze">
                                                {post.title}
                                            </Link>
                                        </CardTitle>
                                        <CardDescription>
                                            {post.author?.name}
                                            {post.published_at && ` \u00B7 ${new Date(post.published_at).toLocaleDateString()}`}
                                        </CardDescription>
                                    </CardHeader>
                                    {post.excerpt && (
                                        <CardContent>
                                            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                                        </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Featured Courses */}
            {featuredCourses.data.length > 0 && (
                <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mb-8 flex items-end justify-between">
                        <h2 className="font-heading text-3xl font-bold tracking-[-0.01em]">Featured Courses</h2>
                        <Button variant="ghost" size="sm" className="text-bronze hover:text-bronze/80" asChild>
                            <Link href="/academy">
                                View All
                                <ArrowRight className="ml-1 size-4" />
                            </Link>
                        </Button>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {featuredCourses.data.map((course) => (
                            <Card key={course.id} className="group border-border/50 bg-card transition-all duration-300 hover:border-bronze/30 hover:shadow-lg hover:shadow-bronze/5">
                                <CardHeader>
                                    {course.difficulty_label && (
                                        <Badge variant="outline" className="w-fit border-bronze/30 text-bronze">
                                            {course.difficulty_label}
                                        </Badge>
                                    )}
                                    <CardTitle className="mt-1 line-clamp-2">
                                        <Link href={`/academy/${course.slug}`} className="transition-colors hover:text-bronze">
                                            {course.title}
                                        </Link>
                                    </CardTitle>
                                </CardHeader>
                                {course.description && (
                                    <CardContent>
                                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{course.description}</p>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.data.length > 0 && (
                <section className="bg-warm-cream/40">
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="mb-8 flex items-end justify-between">
                            <h2 className="font-heading text-3xl font-bold tracking-[-0.01em]">Upcoming Events</h2>
                            <Button variant="ghost" size="sm" className="text-bronze hover:text-bronze/80" asChild>
                                <Link href="/events">
                                    View All
                                    <ArrowRight className="ml-1 size-4" />
                                </Link>
                            </Button>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            {upcomingEvents.data.map((event) => (
                                <Card key={event.id} className="group border-border/50 bg-card transition-all duration-300 hover:border-bronze/30 hover:shadow-lg hover:shadow-bronze/5">
                                    <CardHeader>
                                        <div className="mb-1 flex items-center gap-2">
                                            <CalendarDays className="size-4 text-bronze" />
                                            <span className="text-sm font-medium text-bronze">
                                                {new Date(event.starts_at).toLocaleDateString(undefined, {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        <CardTitle className="line-clamp-2">
                                            <Link href={`/events/${event.slug}`} className="transition-colors hover:text-bronze">
                                                {event.title}
                                            </Link>
                                        </CardTitle>
                                    </CardHeader>
                                    {event.location && (
                                        <CardContent>
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <MapPin className="size-3.5" />
                                                {event.location}
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Explore & Grow Section */}
            <section className="bg-secondary">
                <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <h2 className="font-heading text-3xl font-bold tracking-[-0.01em] sm:text-4xl">
                            Explore & Grow
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                            Discover resources and opportunities to deepen your faith journey.
                        </p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Sermons */}
                        <Card className="group border-border/50 bg-card transition-all duration-300 hover:border-bronze/30 hover:shadow-lg hover:shadow-bronze/5">
                            <CardHeader>
                                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-golden/10">
                                    <Mic2 className="size-5 text-bronze" />
                                </div>
                                <CardTitle>Sermons</CardTitle>
                                <CardDescription className="leading-relaxed">
                                    Watch and listen to our weekly sermons. Catch up on messages you may have missed.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/sermons" className="inline-flex items-center text-sm font-medium text-bronze transition-colors hover:text-bronze/80">
                                    Browse Sermons
                                    <ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Updates */}
                        <Card className="group border-border/50 bg-card transition-all duration-300 hover:border-bronze/30 hover:shadow-lg hover:shadow-bronze/5">
                            <CardHeader>
                                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-golden/10">
                                    <Newspaper className="size-5 text-bronze" />
                                </div>
                                <CardTitle>Updates</CardTitle>
                                <CardDescription className="leading-relaxed">
                                    Stay informed with the latest news, events, and announcements from our church.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/updates" className="inline-flex items-center text-sm font-medium text-bronze transition-colors hover:text-bronze/80">
                                    Read Updates
                                    <ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Reading Plans */}
                        <Card className="group border-border/50 bg-card transition-all duration-300 hover:border-bronze/30 hover:shadow-lg hover:shadow-bronze/5">
                            <CardHeader>
                                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-golden/10">
                                    <BookOpen className="size-5 text-bronze" />
                                </div>
                                <CardTitle>Reading Plans</CardTitle>
                                <CardDescription className="leading-relaxed">
                                    Daily scripture readings to deepen your faith and keep you grounded in the Word.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/reading-plans" className="inline-flex items-center text-sm font-medium text-bronze transition-colors hover:text-bronze/80">
                                    Explore Plans
                                    <ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Academy */}
                        <Card className="group border-border/50 bg-card transition-all duration-300 hover:border-bronze/30 hover:shadow-lg hover:shadow-bronze/5">
                            <CardHeader>
                                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-golden/10">
                                    <GraduationCap className="size-5 text-bronze" />
                                </div>
                                <CardTitle>Academy</CardTitle>
                                <CardDescription className="leading-relaxed">
                                    Structured courses for spiritual growth -- from foundational studies to advanced topics.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/academy" className="inline-flex items-center text-sm font-medium text-bronze transition-colors hover:text-bronze/80">
                                    View Courses
                                    <ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Library */}
                        <Card className="group border-border/50 bg-card transition-all duration-300 hover:border-bronze/30 hover:shadow-lg hover:shadow-bronze/5">
                            <CardHeader>
                                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-golden/10">
                                    <Library className="size-5 text-bronze" />
                                </div>
                                <CardTitle>Book Library</CardTitle>
                                <CardDescription className="leading-relaxed">
                                    Browse and borrow books from our church library. Grow through reading.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/library" className="inline-flex items-center text-sm font-medium text-bronze transition-colors hover:text-bronze/80">
                                    Visit Library
                                    <ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Ministries */}
                        <Card className="group border-border/50 bg-card transition-all duration-300 hover:border-bronze/30 hover:shadow-lg hover:shadow-bronze/5">
                            <CardHeader>
                                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-golden/10">
                                    <Users className="size-5 text-bronze" />
                                </div>
                                <CardTitle>Ministries</CardTitle>
                                <CardDescription className="leading-relaxed">
                                    Find your place in our community. Serve, connect, and grow alongside others.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/ministries" className="inline-flex items-center text-sm font-medium text-bronze transition-colors hover:text-bronze/80">
                                    Find a Ministry
                                    <ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative overflow-hidden bg-earth-dark">
                <div className="absolute -right-20 -top-20 size-[400px] rounded-full bg-golden/[0.06] blur-[100px]" />
                <div className="absolute -bottom-20 -left-20 size-[300px] rounded-full bg-bronze/[0.05] blur-[80px]" />

                <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8">
                    <Heart className="mx-auto mb-6 size-8 text-golden/60" />
                    <h2 className="font-heading text-3xl font-bold tracking-[-0.01em] text-earth-light sm:text-4xl">
                        Ready to Get Connected?
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-earth-light/60">
                        Create an account to track your reading plans, enroll in courses, and stay connected with our community.
                    </p>
                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        {canRegister && (
                            <Button size="lg" className="bg-golden text-earth-dark shadow-lg shadow-golden/20 hover:bg-golden/90" asChild>
                                <Link href="/register">Create an Account</Link>
                            </Button>
                        )}
                        <Button variant="outline" size="lg" className="border-golden/40 text-golden hover:bg-golden/10 hover:text-white" asChild>
                            <Link href="/sermons">Explore Sermons</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}