<?php

namespace Database\Seeders;

use App\Enums\BenevolentCategory;
use App\Enums\BenevolentStatus;
use App\Enums\BenevolentUrgency;
use App\Enums\CaseStatus;
use App\Enums\CaseType;
use App\Enums\CategoryType;
use App\Enums\CourseDifficulty;
use App\Enums\DisbursementMethod;
use App\Enums\DocumentVisibility;
use App\Enums\EventRecurrence;
use App\Enums\FollowUpStatus;
use App\Enums\FollowUpType;
use App\Enums\GoalStatus;
use App\Enums\HighlightType;
use App\Enums\LessonContentType;
use App\Enums\MenuItemTarget;
use App\Enums\MenuItemType;
use App\Enums\MinistryRole;
use App\Enums\QuizQuestionType;
use App\Enums\ReferralType;
use App\Enums\RegistrationStatus;
use App\Enums\ReviewRecommendation;
use App\Enums\ScheduleStatus;
use App\Enums\SessionType;
use App\Enums\UserRole;
use App\Models\BenevolentDisbursement;
use App\Models\BenevolentRequest;
use App\Models\BenevolentReview;
use App\Models\Book;
use App\Models\BookLending;
use App\Models\Category;
use App\Models\CounselingCase;
use App\Models\CounselingGoal;
use App\Models\CounselingReferral;
use App\Models\CounselingSession;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseModule;
use App\Models\Document;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Form;
use App\Models\FormResponse;
use App\Models\GroupMember;
use App\Models\HeroSlide;
use App\Models\Highlight;
use App\Models\Lesson;
use App\Models\MenuItem;
use App\Models\Ministry;
use App\Models\MinistryGroup;
use App\Models\MinistryMember;
use App\Models\Post;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\ReadingPlan;
use App\Models\ReadingPlanDay;
use App\Models\ReadingPlanEnrollment;
use App\Models\ReadingPlanProgress;
use App\Models\Sermon;
use App\Models\SermonSeries;
use App\Models\ServiceTime;
use App\Models\Speaker;
use App\Models\User;
use App\Models\Visitor;
use App\Models\VisitorFollowUp;
use App\Models\VolunteerRole;
use App\Models\VolunteerSchedule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    /** @var array<string, User> */
    private array $users = [];

    /** @var array<string, Category> */
    private array $categories = [];

    /** @var array<string, ServiceTime> */
    private array $serviceTimes = [];

    public function run(): void
    {
        Log::info('DemoSeeder: Starting demo data seeding');

        $this->seedUsers();
        $this->seedServiceTimes();
        $this->seedCategories();
        $this->seedSpeakers();
        $this->seedSermons();
        $this->seedPosts();
        $this->seedHighlights();
        $this->seedReadingPlans();
        $this->seedCourses();
        $this->seedForms();
        $this->seedBooks();
        $this->seedEvents();
        $this->seedMinistries();
        $this->seedVolunteerRoles();
        $this->seedVisitors();
        $this->seedDocuments();
        $this->seedHeroSlides();
        $this->seedMenuItems();
        $this->seedBenevolence();
        $this->seedCounseling();

        Log::info('DemoSeeder: Demo data seeding complete');
    }

    private function seedUsers(): void
    {
        $people = [
            // Demo shortcut accounts (match login page credentials)
            ['name' => 'Admin User', 'email' => 'admin@example.test', 'role' => UserRole::Admin],
            ['name' => 'Staff User', 'email' => 'staff@example.test', 'role' => UserRole::Staff],
            ['name' => 'Counselor User', 'email' => 'counselor@example.test', 'role' => UserRole::Staff],
            ['name' => 'Leader User', 'email' => 'leader@example.test', 'role' => UserRole::Leader],
            ['name' => 'Member User', 'email' => 'member@example.test', 'role' => UserRole::Member],

            // Realistic church members
            ['name' => 'Pastor David Thompson', 'email' => 'pastor@example.test', 'role' => UserRole::Admin],
            ['name' => 'Sarah Mitchell', 'email' => 'sarah@example.test', 'role' => UserRole::Staff],
            ['name' => 'Michael Rodriguez', 'email' => 'michael@example.test', 'role' => UserRole::Staff],
            ['name' => 'James Wilson', 'email' => 'james@example.test', 'role' => UserRole::Leader],
            ['name' => 'Emily Chen', 'email' => 'emily@example.test', 'role' => UserRole::Leader],
            ['name' => 'Robert Davis', 'email' => 'robert@example.test', 'role' => UserRole::Leader],
            ['name' => 'Jessica Taylor', 'email' => 'jessica@example.test', 'role' => UserRole::Member],
            ['name' => 'Daniel Kim', 'email' => 'daniel@example.test', 'role' => UserRole::Member],
            ['name' => 'Amanda Foster', 'email' => 'amanda@example.test', 'role' => UserRole::Member],
            ['name' => 'Christopher Lee', 'email' => 'chris@example.test', 'role' => UserRole::Member],
            ['name' => 'Rachel Nguyen', 'email' => 'rachel@example.test', 'role' => UserRole::Member],
            ['name' => 'Matthew Brown', 'email' => 'matt@example.test', 'role' => UserRole::Member],
            ['name' => 'Lauren Harris', 'email' => 'lauren@example.test', 'role' => UserRole::Member],
            ['name' => 'Andrew Martinez', 'email' => 'andrew@example.test', 'role' => UserRole::Member],
            ['name' => 'Sophia Clark', 'email' => 'sophia@example.test', 'role' => UserRole::Member],
            ['name' => 'Nathan Wright', 'email' => 'nathan@example.test', 'role' => UserRole::Member],
            ['name' => 'Grace Johnson', 'email' => 'grace@example.test', 'role' => UserRole::Member],
            ['name' => 'Benjamin Parker', 'email' => 'ben@example.test', 'role' => UserRole::Member],
            ['name' => 'Olivia Thomas', 'email' => 'olivia@example.test', 'role' => UserRole::Member],
            ['name' => 'Kevin Anderson', 'email' => 'kevin@example.test', 'role' => UserRole::Member],
        ];

        foreach ($people as $person) {
            $user = User::firstOrCreate(
                ['email' => $person['email']],
                [
                    'name' => $person['name'],
                    'role' => $person['role'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ],
            );
            $key = Str::before($person['email'], '@');
            $this->users[$key] = $user;
        }

        Log::info('DemoSeeder: Seeded '.count($this->users).' users');
    }

    private function seedServiceTimes(): void
    {
        $times = [
            ['name' => 'Sunday Early Service', 'start_time' => '08:00', 'end_time' => '09:15', 'sort_order' => 1],
            ['name' => 'Sunday Main Service', 'start_time' => '10:30', 'end_time' => '12:00', 'sort_order' => 2],
            ['name' => 'Sunday Evening Service', 'start_time' => '18:00', 'end_time' => '19:30', 'sort_order' => 3],
            ['name' => 'Wednesday Bible Study', 'start_time' => '19:00', 'end_time' => '20:30', 'sort_order' => 4],
        ];

        foreach ($times as $time) {
            $st = ServiceTime::firstOrCreate(
                ['name' => $time['name']],
                array_merge($time, ['is_active' => true]),
            );
            $this->serviceTimes[$st->slug] = $st;
        }

        Log::info('DemoSeeder: Seeded '.count($this->serviceTimes).' service times');
    }

    private function seedCategories(): void
    {
        $categoryData = [
            [CategoryType::Sermon, ['Topical', 'Expository', 'Evangelistic', 'Devotional']],
            [CategoryType::Post, ['Church News', 'Devotionals', 'Missions Update', 'Community']],
            [CategoryType::Book, ['Theology', 'Christian Living', 'Bible Study', 'Youth']],
            [CategoryType::Academy, ['Bible Studies', 'Leadership', 'Marriage & Family', 'New Believers']],
            [CategoryType::Event, ['Worship', 'Fellowship', 'Outreach', 'Youth Events', 'Conference']],
            [CategoryType::Document, ['Policies', 'Bulletins', 'Reports', 'Templates']],
            [CategoryType::Page, ['About', 'Ministries', 'Resources']],
        ];

        foreach ($categoryData as [$type, $names]) {
            foreach ($names as $index => $name) {
                $cat = Category::firstOrCreate(
                    ['slug' => Str::slug($name), 'type' => $type],
                    [
                        'name' => $name,
                        'description' => "Category for {$type->label()}: {$name}",
                        'sort_order' => $index,
                    ],
                );
                $this->categories["{$type->value}_{$cat->slug}"] = $cat;
            }
        }

        Log::info('DemoSeeder: Seeded categories');
    }

    private function seedSpeakers(): void
    {
        $speakers = [
            [
                'name' => 'Pastor David Thompson',
                'slug' => 'pastor-david-thompson',
                'title' => 'Senior Pastor',
                'bio' => '<p>Pastor David has served Grace Community Church for over 15 years. He holds an M.Div from Trinity Evangelical Divinity School and is passionate about expository preaching and discipleship.</p>',
            ],
            [
                'name' => 'Dr. Rebecca Morgan',
                'slug' => 'dr-rebecca-morgan',
                'title' => 'Guest Speaker',
                'bio' => '<p>Dr. Morgan is a professor of Old Testament studies at Wheaton College and a frequent conference speaker on biblical theology.</p>',
            ],
            [
                'name' => 'Michael Rodriguez',
                'slug' => 'michael-rodriguez',
                'title' => 'Youth Pastor',
                'bio' => '<p>Pastor Michael leads our youth ministry and is passionate about reaching the next generation with the Gospel. He joined our team in 2022.</p>',
            ],
            [
                'name' => 'James Wilson',
                'slug' => 'james-wilson',
                'title' => 'Elder / Lay Preacher',
                'bio' => '<p>James serves as an elder and occasionally fills the pulpit. He brings a practical, real-world perspective to his messages drawn from 20 years in business leadership.</p>',
            ],
        ];

        foreach ($speakers as $data) {
            Speaker::firstOrCreate(['slug' => $data['slug']], $data);
        }

        Log::info('DemoSeeder: Seeded speakers');
    }

    private function seedSermons(): void
    {
        $pastorDavid = Speaker::where('slug', 'pastor-david-thompson')->first();
        $drMorgan = Speaker::where('slug', 'dr-rebecca-morgan')->first();
        $pastorMichael = Speaker::where('slug', 'michael-rodriguez')->first();
        $jamesWilson = Speaker::where('slug', 'james-wilson')->first();
        $admin = $this->users['pastor'];

        // Current active series
        $currentSeries = SermonSeries::firstOrCreate(
            ['slug' => 'unshakeable-faith'],
            [
                'title' => 'Unshakeable Faith',
                'description' => 'A verse-by-verse study through the book of James, exploring what it means to live out authentic faith in everyday life.',
                'start_date' => now()->subWeeks(4)->toDateString(),
                'end_date' => null,
                'is_active' => true,
                'sort_order' => 1,
            ],
        );

        $currentSermons = [
            ['title' => 'Trials and Temptations', 'scripture_references' => ['James 1:1-18'], 'weeks_ago' => 4],
            ['title' => 'Doers of the Word', 'scripture_references' => ['James 1:19-27'], 'weeks_ago' => 3],
            ['title' => 'No Favoritism', 'scripture_references' => ['James 2:1-13'], 'weeks_ago' => 2],
            ['title' => 'Faith and Works', 'scripture_references' => ['James 2:14-26'], 'weeks_ago' => 1],
            ['title' => 'Taming the Tongue', 'scripture_references' => ['James 3:1-12'], 'weeks_ago' => 0],
        ];

        foreach ($currentSermons as $index => $data) {
            $sermonDate = now()->subWeeks($data['weeks_ago'])->startOfWeek()->addDays(6);
            Sermon::firstOrCreate(
                ['slug' => Str::slug($data['title'])],
                [
                    'title' => $data['title'],
                    'description' => 'Part '.($index + 1).' of the Unshakeable Faith series.',
                    'notes' => '<p>Sermon notes for '.$data['title'].' from '.implode(', ', $data['scripture_references']).'.</p>',
                    'scripture_references' => $data['scripture_references'],
                    'sermon_date' => $sermonDate,
                    'is_current_week' => $data['weeks_ago'] === 0,
                    'video_url' => 'https://www.youtube.com/watch?v=example'.($index + 1),
                    'speaker_id' => $pastorDavid->id,
                    'series_id' => $currentSeries->id,
                    'published_at' => $sermonDate,
                    'created_by' => $admin->id,
                ],
            );
        }

        // Completed past series
        $pastSeries = SermonSeries::firstOrCreate(
            ['slug' => 'foundations-of-grace'],
            [
                'title' => 'Foundations of Grace',
                'description' => 'Exploring the doctrine of grace through the lens of Ephesians, discovering how God\'s unmerited favor shapes every aspect of the Christian life.',
                'start_date' => now()->subMonths(4)->toDateString(),
                'end_date' => now()->subWeeks(5)->toDateString(),
                'is_active' => false,
                'sort_order' => 2,
            ],
        );

        $pastSermons = [
            ['title' => 'Chosen Before the Foundation', 'scripture' => ['Ephesians 1:1-14'], 'speaker' => $pastorDavid, 'weeks_ago' => 16],
            ['title' => 'Alive in Christ', 'scripture' => ['Ephesians 2:1-10'], 'speaker' => $pastorDavid, 'weeks_ago' => 14],
            ['title' => 'One Body, One Spirit', 'scripture' => ['Ephesians 4:1-16'], 'speaker' => $drMorgan, 'weeks_ago' => 12],
            ['title' => 'Walking in Love', 'scripture' => ['Ephesians 5:1-21'], 'speaker' => $pastorDavid, 'weeks_ago' => 10],
            ['title' => 'The Armor of God', 'scripture' => ['Ephesians 6:10-20'], 'speaker' => $jamesWilson, 'weeks_ago' => 8],
            ['title' => 'Stand Firm', 'scripture' => ['Ephesians 6:10-24'], 'speaker' => $pastorDavid, 'weeks_ago' => 6],
        ];

        foreach ($pastSermons as $index => $data) {
            $sermonDate = now()->subWeeks($data['weeks_ago'])->startOfWeek()->addDays(6);
            Sermon::firstOrCreate(
                ['slug' => Str::slug($data['title'])],
                [
                    'title' => $data['title'],
                    'description' => 'Part '.($index + 1).' of the Foundations of Grace series.',
                    'notes' => '<p>Sermon notes for '.$data['title'].'.</p>',
                    'scripture_references' => $data['scripture'],
                    'sermon_date' => $sermonDate,
                    'is_current_week' => false,
                    'video_url' => null,
                    'speaker_id' => $data['speaker']->id,
                    'series_id' => $pastSeries->id,
                    'published_at' => $sermonDate,
                    'created_by' => $admin->id,
                ],
            );
        }

        // Standalone youth sermon
        Sermon::firstOrCreate(
            ['slug' => 'identity-in-christ'],
            [
                'title' => 'Identity in Christ',
                'description' => 'A special youth service message about finding our true identity.',
                'notes' => '<p>Who does God say you are? Let\'s explore what Scripture teaches about our identity in Christ.</p>',
                'scripture_references' => ['2 Corinthians 5:17', 'Galatians 2:20'],
                'sermon_date' => now()->subWeeks(5)->startOfWeek()->addDays(6),
                'is_current_week' => false,
                'video_url' => null,
                'speaker_id' => $pastorMichael->id,
                'series_id' => null,
                'published_at' => now()->subWeeks(5),
                'created_by' => $admin->id,
            ],
        );

        Log::info('DemoSeeder: Seeded sermon series and sermons');
    }

    private function seedPosts(): void
    {
        $admin = $this->users['pastor'];
        $staff = $this->users['sarah'];
        $newsCategory = $this->categories['post_church-news'] ?? null;
        $devCategory = $this->categories['post_devotionals'] ?? null;
        $missionsCategory = $this->categories['post_missions-update'] ?? null;

        $posts = [
            [
                'title' => 'Easter Celebration Recap',
                'slug' => 'easter-celebration-recap',
                'excerpt' => 'What an incredible Easter weekend! Over 500 people joined us for our sunrise service and main celebrations.',
                'body' => '<h2>A Weekend to Remember</h2><p>This Easter was one for the books. Our sunrise service at 6:30 AM drew over 150 early risers who gathered to celebrate the resurrection as the sun came up over the hills.</p><p>The main service saw over 350 attendees, with 12 people making first-time decisions for Christ. Our children\'s ministry hosted an egg hunt that brought smiles to over 80 kids.</p><h3>Thank You Volunteers</h3><p>None of this would have been possible without our 45+ volunteers who gave their time to set up, serve, and tear down. You are the hands and feet of Jesus.</p>',
                'category_id' => $newsCategory?->id,
                'is_featured' => true,
                'published_at' => now()->subDays(5),
                'author_id' => $staff->id,
            ],
            [
                'title' => 'Morning Mercies: Finding Hope in Lamentations',
                'slug' => 'morning-mercies-finding-hope',
                'excerpt' => 'Even in our darkest seasons, God\'s mercies are new every morning. A reflection on Lamentations 3:22-23.',
                'body' => '<h2>Great Is Thy Faithfulness</h2><p>The book of Lamentations is not typically where we turn for encouragement. Written in the aftermath of Jerusalem\'s destruction, it is raw with grief and loss.</p><p>Yet nestled in the very center of this book of sorrow, we find one of Scripture\'s most beautiful declarations: "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness."</p><p>Whatever you are walking through today, know that God\'s compassion has not run dry. His mercies are fresh this morning, custom-made for whatever this day holds.</p>',
                'category_id' => $devCategory?->id,
                'is_featured' => false,
                'published_at' => now()->subDays(3),
                'author_id' => $admin->id,
            ],
            [
                'title' => 'Missions Trip to Guatemala: Team Update',
                'slug' => 'guatemala-missions-trip-update',
                'excerpt' => 'Our team of 8 just returned from two weeks serving in Antigua, Guatemala. Here\'s what God did.',
                'body' => '<h2>Two Weeks That Changed Us</h2><p>Our Guatemala missions team returned last Saturday after an incredible two weeks serving alongside local church partners in Antigua.</p><h3>What We Accomplished</h3><ul><li>Completed construction on a community center that will serve 200+ families</li><li>Ran a VBS program for 120 children</li><li>Distributed 500 food packages through local churches</li><li>Trained 15 local leaders in children\'s ministry curriculum</li></ul><p>Team leader Robert Davis shared, "This trip reminded me that the body of Christ truly knows no borders. Our Guatemalan brothers and sisters taught us far more than we taught them."</p>',
                'category_id' => $missionsCategory?->id,
                'is_featured' => true,
                'published_at' => now()->subWeeks(1),
                'author_id' => $this->users['robert']->id,
            ],
            [
                'title' => 'Summer Youth Camp Registration Now Open',
                'slug' => 'summer-youth-camp-registration',
                'excerpt' => 'Camp Pinnacle is back! July 14-18 for students grades 6-12. Early bird pricing available through May.',
                'body' => '<h2>Camp Pinnacle 2026</h2><p>We are excited to announce that registration is now open for our annual summer youth camp! This year we\'re heading to Camp Pinnacle in the Blue Ridge Mountains for five days of worship, adventure, and spiritual growth.</p><h3>Details</h3><ul><li><strong>Dates:</strong> July 14-18, 2026</li><li><strong>Location:</strong> Camp Pinnacle, Blue Ridge Mountains</li><li><strong>Cost:</strong> $350 (early bird $299 through May 31)</li><li><strong>Ages:</strong> Rising 6th through 12th graders</li></ul><p>Scholarships are available for families who need financial assistance. Contact Pastor Michael for details.</p>',
                'category_id' => $newsCategory?->id,
                'is_featured' => false,
                'published_at' => now()->subDays(1),
                'author_id' => $this->users['michael']->id,
            ],
            [
                'title' => 'Walking Through Grief: A Pastor\'s Perspective',
                'slug' => 'walking-through-grief',
                'excerpt' => 'Grief is not a problem to be solved but a journey to be walked. Thoughts on accompanying others through loss.',
                'body' => '<h2>Sitting in the Ashes</h2><p>When Job\'s friends first arrived, they did the most profound thing recorded in their story: they sat with him in silence for seven days. It was only when they opened their mouths that things went wrong.</p><p>In fifteen years of pastoral ministry, I\'ve learned that the most powerful thing we can offer someone in grief is not answers but presence. Not explanations but empathy.</p><p>If someone in your life is grieving, resist the urge to fix it. Instead, show up. Bring a meal. Send a card. Sit in the silence. Your presence preaches the Gospel louder than any sermon.</p>',
                'category_id' => $devCategory?->id,
                'is_featured' => false,
                'published_at' => now()->subWeeks(2),
                'author_id' => $admin->id,
            ],
        ];

        foreach ($posts as $data) {
            Post::firstOrCreate(['slug' => $data['slug']], $data);
        }

        // Draft post
        Post::firstOrCreate(
            ['slug' => 'volunteer-appreciation-dinner'],
            [
                'title' => 'Volunteer Appreciation Dinner',
                'slug' => 'volunteer-appreciation-dinner',
                'excerpt' => 'Save the date for our annual volunteer appreciation dinner on April 25th.',
                'body' => '<p>Draft content - details coming soon.</p>',
                'category_id' => $newsCategory?->id,
                'is_featured' => false,
                'published_at' => null,
                'author_id' => $staff->id,
            ],
        );

        Log::info('DemoSeeder: Seeded posts');
    }

    private function seedHighlights(): void
    {
        $admin = $this->users['pastor'];

        $highlights = [
            [
                'title' => 'VBS Registration Opens April 1st',
                'slug' => 'vbs-registration-opens',
                'body' => '<p>Vacation Bible School is coming June 9-13! This year\'s theme is "Expedition Adventure" and is open to children ages 4 through 5th grade. Online registration opens April 1st.</p>',
                'type' => HighlightType::Announcement,
                'priority' => 1,
                'is_active' => true,
                'starts_at' => now()->subDays(2),
                'ends_at' => now()->addMonths(1),
                'author_id' => $admin->id,
            ],
            [
                'title' => 'Community Outreach Day',
                'slug' => 'community-outreach-day-highlight',
                'body' => '<p>Join us Saturday, April 12th as we serve our neighbors through yard work, home repairs, and delivering meals to the homebound. Meet at the church at 8 AM.</p>',
                'type' => HighlightType::Event,
                'priority' => 2,
                'is_active' => true,
                'starts_at' => now(),
                'ends_at' => now()->addWeeks(3),
                'author_id' => $admin->id,
            ],
            [
                'title' => 'Building Fund Update: 78% of Goal Reached',
                'slug' => 'building-fund-update',
                'body' => '<p>Thanks to your generous giving, we have raised $780,000 toward our $1,000,000 goal for the new family life center. We are on track to break ground this fall!</p>',
                'type' => HighlightType::Campaign,
                'priority' => 3,
                'is_active' => true,
                'starts_at' => now()->subWeeks(1),
                'ends_at' => now()->addMonths(3),
                'author_id' => $admin->id,
            ],
            [
                'title' => 'From Addiction to Freedom: Mark\'s Story',
                'slug' => 'marks-testimony',
                'body' => '<p>"Five years ago I walked through these doors broken and hopeless. Today I stand as a living testimony of what God can do. The recovery ministry at Grace Community didn\'t just help me get clean -- they gave me a family." -- Mark S.</p>',
                'type' => HighlightType::Testimony,
                'priority' => 4,
                'is_active' => true,
                'starts_at' => now()->subDays(3),
                'ends_at' => now()->addWeeks(2),
                'author_id' => $admin->id,
            ],
        ];

        foreach ($highlights as $data) {
            Highlight::firstOrCreate(['slug' => $data['slug']], $data);
        }

        Log::info('DemoSeeder: Seeded highlights');
    }

    private function seedReadingPlans(): void
    {
        $admin = $this->users['pastor'];

        // 7-day plan
        $plan1 = ReadingPlan::firstOrCreate(
            ['slug' => 'psalms-of-comfort'],
            [
                'title' => 'Psalms of Comfort',
                'description' => 'A week-long journey through seven psalms that bring peace and comfort in times of trouble.',
                'duration_days' => 7,
                'is_published' => true,
                'created_by' => $admin->id,
            ],
        );

        $psalmDays = [
            ['day_number' => 1, 'title' => 'The Lord Is My Shepherd', 'scripture_reference' => 'Psalm 23', 'reflection' => 'How has God been your shepherd this week? Where do you need His guidance today?'],
            ['day_number' => 2, 'title' => 'God Is Our Refuge', 'scripture_reference' => 'Psalm 46', 'reflection' => 'What storms are you facing? How can you find stillness in God\'s presence?'],
            ['day_number' => 3, 'title' => 'Have Mercy on Me', 'scripture_reference' => 'Psalm 51', 'reflection' => 'Is there an area of your life where you need God\'s cleansing and renewal?'],
            ['day_number' => 4, 'title' => 'My Soul Thirsts for God', 'scripture_reference' => 'Psalm 63', 'reflection' => 'How hungry are you for God\'s presence? What competes for that space in your heart?'],
            ['day_number' => 5, 'title' => 'Teach Us to Number Our Days', 'scripture_reference' => 'Psalm 90', 'reflection' => 'How are you stewarding the time God has given you?'],
            ['day_number' => 6, 'title' => 'He Heals the Brokenhearted', 'scripture_reference' => 'Psalm 147', 'reflection' => 'Where do you need God\'s healing touch today?'],
            ['day_number' => 7, 'title' => 'Let Everything Praise the Lord', 'scripture_reference' => 'Psalm 150', 'reflection' => 'Take time to praise God for His faithfulness throughout this week.'],
        ];

        foreach ($psalmDays as $dayData) {
            ReadingPlanDay::firstOrCreate(
                ['reading_plan_id' => $plan1->id, 'day_number' => $dayData['day_number']],
                $dayData + ['reading_plan_id' => $plan1->id],
            );
        }

        // 21-day plan
        $plan2 = ReadingPlan::firstOrCreate(
            ['slug' => 'gospel-of-john'],
            [
                'title' => 'Discovering Jesus in John',
                'description' => 'A three-week deep dive into the Gospel of John, exploring the life, ministry, and mission of Jesus Christ through the eyes of the beloved disciple.',
                'duration_days' => 21,
                'is_published' => true,
                'created_by' => $admin->id,
            ],
        );

        for ($day = 1; $day <= 21; $day++) {
            ReadingPlanDay::firstOrCreate(
                ['reading_plan_id' => $plan2->id, 'day_number' => $day],
                [
                    'reading_plan_id' => $plan2->id,
                    'day_number' => $day,
                    'title' => "John Chapter {$day}",
                    'scripture_reference' => "John {$day}",
                    'reflection' => "What stood out to you in John {$day}? How does this passage reveal who Jesus is?",
                ],
            );
        }

        // Unpublished draft plan
        ReadingPlan::firstOrCreate(
            ['slug' => 'proverbs-31-days'],
            [
                'title' => 'Proverbs: 31 Days of Wisdom',
                'description' => 'Read one chapter of Proverbs each day for a month of practical wisdom for daily life.',
                'duration_days' => 31,
                'is_published' => false,
                'created_by' => $admin->id,
            ],
        );

        // Enroll members with progress
        $enrollUsers = ['jessica', 'daniel', 'amanda', 'rachel', 'matt', 'grace'];
        foreach ($enrollUsers as $i => $key) {
            if (! isset($this->users[$key])) {
                continue;
            }
            $plan = $i < 3 ? $plan1 : $plan2;
            $enrollment = ReadingPlanEnrollment::firstOrCreate(
                ['user_id' => $this->users[$key]->id, 'reading_plan_id' => $plan->id],
                ['started_at' => now()->subDays(rand(2, 10))],
            );

            $daysToComplete = rand(1, min(5, $plan->duration_days));
            $days = $plan->days()->orderBy('day_number')->limit($daysToComplete)->get();
            foreach ($days as $planDay) {
                ReadingPlanProgress::firstOrCreate(
                    ['enrollment_id' => $enrollment->id, 'day_id' => $planDay->id],
                    ['completed_at' => now()->subDays(rand(0, 5))],
                );
            }
        }

        Log::info('DemoSeeder: Seeded reading plans with enrollments');
    }

    private function seedCourses(): void
    {
        $admin = $this->users['pastor'];
        $newBelieversCat = $this->categories['academy_new-believers'] ?? null;
        $leadershipCat = $this->categories['academy_leadership'] ?? null;
        $bibleStudyCat = $this->categories['academy_bible-studies'] ?? null;

        // New Believers course (Beginner)
        $course1 = Course::firstOrCreate(
            ['slug' => 'foundations-101'],
            [
                'title' => 'Foundations 101: Starting Your Faith Journey',
                'description' => 'A four-week course for new believers covering the basics of the Christian faith including salvation, prayer, Bible reading, and church community.',
                'category_id' => $newBelieversCat?->id,
                'difficulty' => CourseDifficulty::Beginner,
                'estimated_hours' => 8,
                'is_published' => true,
                'requires_enrollment' => true,
                'max_enrollments' => 30,
                'created_by' => $admin->id,
            ],
        );

        $modules1 = [
            [
                'title' => 'Understanding Salvation',
                'description' => 'What it means to be saved and how to have assurance of your faith.',
                'lessons' => [
                    ['title' => 'What Is the Gospel?', 'body' => '<p>The word "gospel" means "good news." At its core, the Gospel is the message that God loves us, that we have all sinned and fallen short of His glory, and that through Jesus Christ we can be forgiven and reconciled to God.</p><h3>Key Verses</h3><ul><li>Romans 3:23 - "For all have sinned and fall short of the glory of God"</li><li>Romans 6:23 - "For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord"</li><li>John 3:16 - "For God so loved the world..."</li></ul>'],
                    ['title' => 'Assurance of Salvation', 'body' => '<p>How can you know for certain that you are saved? This lesson explores what the Bible says about the security of the believer and how to rest in the promises of God.</p><h3>Five Assurances</h3><ol><li>Assurance of Salvation (1 John 5:11-12)</li><li>Assurance of Answered Prayer (John 16:24)</li><li>Assurance of Victory (1 Corinthians 10:13)</li><li>Assurance of Forgiveness (1 John 1:9)</li><li>Assurance of Guidance (Proverbs 3:5-6)</li></ol>'],
                ],
            ],
            [
                'title' => 'Spiritual Disciplines',
                'description' => 'Building habits that foster spiritual growth.',
                'lessons' => [
                    ['title' => 'How to Read Your Bible', 'body' => '<p>The Bible can seem overwhelming at first. This lesson provides practical methods for daily Bible reading and study.</p><h3>The SOAP Method</h3><ul><li><strong>S</strong>cripture - Read a passage</li><li><strong>O</strong>bservation - What do you notice?</li><li><strong>A</strong>pplication - How does it apply to your life?</li><li><strong>P</strong>rayer - Talk to God about what you read</li></ul>'],
                    ['title' => 'The Power of Prayer', 'body' => '<p>Prayer is simply talking with God. Learn how to develop a meaningful prayer life using the ACTS model: Adoration, Confession, Thanksgiving, Supplication.</p>'],
                    ['title' => 'Finding Your Church Family', 'body' => '<p>God designed us to live in community. This lesson covers why church matters, how to get connected, and the importance of serving others.</p>'],
                ],
            ],
        ];

        foreach ($modules1 as $mIndex => $moduleData) {
            $module = CourseModule::firstOrCreate(
                ['course_id' => $course1->id, 'title' => $moduleData['title']],
                [
                    'course_id' => $course1->id,
                    'description' => $moduleData['description'],
                    'sort_order' => $mIndex,
                ],
            );

            foreach ($moduleData['lessons'] as $lIndex => $lessonData) {
                $lesson = Lesson::firstOrCreate(
                    ['slug' => Str::slug($lessonData['title']), 'module_id' => $module->id],
                    [
                        'module_id' => $module->id,
                        'title' => $lessonData['title'],
                        'content_type' => LessonContentType::Text,
                        'body' => $lessonData['body'],
                        'duration_minutes' => rand(15, 30),
                        'sort_order' => $lIndex,
                        'is_free_preview' => $mIndex === 0 && $lIndex === 0,
                    ],
                );

                // Add quiz to first lesson
                if ($mIndex === 0 && $lIndex === 0) {
                    $quiz = Quiz::firstOrCreate(
                        ['lesson_id' => $lesson->id, 'title' => 'Gospel Basics Quiz'],
                        [
                            'description' => 'Test your understanding of the Gospel message.',
                            'passing_score' => 70,
                            'time_limit_minutes' => 10,
                            'max_attempts' => 3,
                        ],
                    );

                    QuizQuestion::firstOrCreate(
                        ['quiz_id' => $quiz->id, 'question' => 'What does the word "gospel" mean?'],
                        [
                            'type' => QuizQuestionType::MultipleChoice,
                            'options' => ['Good news', 'Bad news', 'Old story', 'New law'],
                            'correct_answer' => 'Good news',
                            'points' => 10,
                            'sort_order' => 0,
                            'explanation' => 'The word "gospel" literally means "good news" - the good news of salvation through Jesus Christ.',
                        ],
                    );

                    QuizQuestion::firstOrCreate(
                        ['quiz_id' => $quiz->id, 'question' => 'According to Romans 3:23, all have sinned and fall short of the glory of God.'],
                        [
                            'type' => QuizQuestionType::TrueFalse,
                            'options' => ['True', 'False'],
                            'correct_answer' => 'True',
                            'points' => 10,
                            'sort_order' => 1,
                            'explanation' => 'Romans 3:23 clearly states that all people have sinned.',
                        ],
                    );
                }
            }
        }

        // Leadership course (Intermediate)
        $course2 = Course::firstOrCreate(
            ['slug' => 'servant-leadership'],
            [
                'title' => 'Servant Leadership in the Church',
                'description' => 'An intermediate course exploring biblical principles of servant leadership, team building, and ministry management for current and aspiring church leaders.',
                'category_id' => $leadershipCat?->id,
                'difficulty' => CourseDifficulty::Intermediate,
                'estimated_hours' => 12,
                'is_published' => true,
                'requires_enrollment' => true,
                'max_enrollments' => 20,
                'created_by' => $admin->id,
            ],
        );

        $leaderModule = CourseModule::firstOrCreate(
            ['course_id' => $course2->id, 'title' => 'Biblical Models of Leadership'],
            [
                'course_id' => $course2->id,
                'description' => 'Examining leadership examples from Scripture.',
                'sort_order' => 0,
            ],
        );

        Lesson::firstOrCreate(
            ['slug' => 'jesus-the-ultimate-servant-leader', 'module_id' => $leaderModule->id],
            [
                'module_id' => $leaderModule->id,
                'title' => 'Jesus: The Ultimate Servant Leader',
                'content_type' => LessonContentType::Text,
                'body' => '<p>In Mark 10:45, Jesus declared that He "did not come to be served, but to serve." This lesson unpacks what servant leadership looks like through the example of Jesus washing His disciples\' feet in John 13.</p><h3>Principles of Servant Leadership</h3><ol><li>Lead by example, not by position</li><li>Prioritize the needs of others</li><li>Empower rather than control</li><li>Build trust through vulnerability</li><li>Measure success by the growth of those you lead</li></ol>',
                'duration_minutes' => 25,
                'sort_order' => 0,
                'is_free_preview' => true,
            ],
        );

        Lesson::firstOrCreate(
            ['slug' => 'moses-leading-through-adversity', 'module_id' => $leaderModule->id],
            [
                'module_id' => $leaderModule->id,
                'title' => 'Moses: Leading Through Adversity',
                'content_type' => LessonContentType::Text,
                'body' => '<p>Moses is one of the most significant leaders in Scripture. From reluctant shepherd to liberator of a nation, his journey teaches us about leading when we feel inadequate, managing conflict, and the importance of delegating well (Exodus 18).</p>',
                'duration_minutes' => 30,
                'sort_order' => 1,
                'is_free_preview' => false,
            ],
        );

        // Bible Study course (Advanced)
        $course3 = Course::firstOrCreate(
            ['slug' => 'hermeneutics-advanced'],
            [
                'title' => 'Advanced Biblical Hermeneutics',
                'description' => 'An advanced course on interpreting Scripture using historical, grammatical, and literary analysis methods.',
                'category_id' => $bibleStudyCat?->id,
                'difficulty' => CourseDifficulty::Advanced,
                'estimated_hours' => 16,
                'is_published' => true,
                'requires_enrollment' => true,
                'max_enrollments' => 15,
                'created_by' => $admin->id,
            ],
        );

        $hermModule = CourseModule::firstOrCreate(
            ['course_id' => $course3->id, 'title' => 'Foundations of Interpretation'],
            [
                'course_id' => $course3->id,
                'description' => 'Core principles for responsible Bible interpretation.',
                'sort_order' => 0,
            ],
        );

        Lesson::firstOrCreate(
            ['slug' => 'context-is-king', 'module_id' => $hermModule->id],
            [
                'module_id' => $hermModule->id,
                'title' => 'Context Is King',
                'content_type' => LessonContentType::Text,
                'body' => '<p>The single most important principle in biblical interpretation is context. A text without a context is a pretext for a proof text. This lesson explores historical context, literary context, and canonical context.</p>',
                'duration_minutes' => 35,
                'sort_order' => 0,
                'is_free_preview' => true,
            ],
        );

        // Enroll users
        $enrollees = [
            ['key' => 'jessica', 'course' => $course1, 'progress' => 60],
            ['key' => 'daniel', 'course' => $course1, 'progress' => 40],
            ['key' => 'rachel', 'course' => $course1, 'progress' => 100],
            ['key' => 'james', 'course' => $course2, 'progress' => 50],
            ['key' => 'emily', 'course' => $course2, 'progress' => 25],
            ['key' => 'matt', 'course' => $course3, 'progress' => 10],
        ];

        foreach ($enrollees as $data) {
            if (! isset($this->users[$data['key']])) {
                continue;
            }
            CourseEnrollment::firstOrCreate(
                ['user_id' => $this->users[$data['key']]->id, 'course_id' => $data['course']->id],
                [
                    'enrolled_at' => now()->subDays(rand(3, 21)),
                    'progress_percentage' => $data['progress'],
                    'completed_at' => $data['progress'] >= 100 ? now()->subDays(2) : null,
                ],
            );
        }

        Log::info('DemoSeeder: Seeded courses with modules, lessons, quizzes, and enrollments');
    }

    private function seedForms(): void
    {
        $staff = $this->users['sarah'];

        // Prayer Request form
        $prayerForm = Form::firstOrCreate(
            ['slug' => 'prayer-request'],
            [
                'title' => 'Prayer Request',
                'description' => 'Submit a prayer request and our prayer team will lift you up.',
                'fields' => [
                    ['id' => 'name', 'type' => 'text', 'label' => 'Your Name', 'required' => true],
                    ['id' => 'email', 'type' => 'email', 'label' => 'Email Address', 'required' => false],
                    ['id' => 'category', 'type' => 'select', 'label' => 'Prayer Category', 'required' => true, 'options' => ['Health', 'Family', 'Financial', 'Spiritual Growth', 'Other']],
                    ['id' => 'request', 'type' => 'textarea', 'label' => 'Prayer Request', 'required' => true],
                    ['id' => 'confidential', 'type' => 'checkbox', 'label' => 'Keep this request confidential (pastor only)', 'required' => false],
                ],
                'settings' => ['confirmation_message' => 'Thank you for sharing your prayer request. Our team will be praying for you.'],
                'is_multi_step' => false,
                'is_published' => true,
                'allows_anonymous' => true,
                'created_by' => $staff->id,
            ],
        );

        $respondents = ['jessica', 'amanda', 'grace', 'nathan'];
        foreach ($respondents as $key) {
            if (! isset($this->users[$key])) {
                continue;
            }
            FormResponse::firstOrCreate(
                ['form_id' => $prayerForm->id, 'user_id' => $this->users[$key]->id],
                [
                    'answers' => [
                        'name' => $this->users[$key]->name,
                        'email' => $this->users[$key]->email,
                        'category' => collect(['Health', 'Family', 'Spiritual Growth'])->random(),
                        'request' => 'Please keep this request in your prayers.',
                        'confidential' => false,
                    ],
                    'submitted_at' => now()->subDays(rand(0, 14)),
                ],
            );
        }

        // Volunteer Interest form
        Form::firstOrCreate(
            ['slug' => 'volunteer-interest'],
            [
                'title' => 'Volunteer Interest Form',
                'description' => 'Let us know how you would like to serve at Grace Community Church.',
                'fields' => [
                    ['id' => 'name', 'type' => 'text', 'label' => 'Full Name', 'required' => true],
                    ['id' => 'phone', 'type' => 'text', 'label' => 'Phone Number', 'required' => true],
                    ['id' => 'areas', 'type' => 'checkbox_group', 'label' => 'Areas of Interest', 'required' => true, 'options' => ['Worship Team', 'Children\'s Ministry', 'Youth Ministry', 'Greeting/Ushering', 'Tech/Sound', 'Kitchen/Hospitality', 'Outreach']],
                    ['id' => 'availability', 'type' => 'select', 'label' => 'Availability', 'required' => true, 'options' => ['Sunday Morning', 'Sunday Evening', 'Wednesday Evening', 'Flexible']],
                    ['id' => 'notes', 'type' => 'textarea', 'label' => 'Additional Notes', 'required' => false],
                ],
                'settings' => ['confirmation_message' => 'Thank you for your willingness to serve! A ministry leader will reach out to you soon.'],
                'is_multi_step' => false,
                'is_published' => true,
                'allows_anonymous' => false,
                'created_by' => $staff->id,
            ],
        );

        // Visitor Connection Card
        Form::firstOrCreate(
            ['slug' => 'visitor-connection-card'],
            [
                'title' => 'Visitor Connection Card',
                'description' => 'Welcome! We\'d love to connect with you. Please fill out this brief card.',
                'fields' => [
                    ['id' => 'name', 'type' => 'text', 'label' => 'Name', 'required' => true],
                    ['id' => 'email', 'type' => 'email', 'label' => 'Email', 'required' => true],
                    ['id' => 'phone', 'type' => 'text', 'label' => 'Phone', 'required' => false],
                    ['id' => 'how_heard', 'type' => 'select', 'label' => 'How did you hear about us?', 'required' => false, 'options' => ['Friend/Family', 'Website', 'Social Media', 'Drive-by', 'Community Event', 'Other']],
                    ['id' => 'interests', 'type' => 'checkbox_group', 'label' => 'I\'d like to learn more about:', 'required' => false, 'options' => ['Membership', 'Small Groups', 'Children\'s Ministry', 'Youth Ministry', 'Serving Opportunities', 'Bible Studies']],
                ],
                'settings' => ['confirmation_message' => 'Welcome to Grace Community! We\'re so glad you visited. Someone from our team will be in touch.'],
                'is_multi_step' => false,
                'is_published' => true,
                'allows_anonymous' => true,
                'created_by' => $staff->id,
            ],
        );

        Log::info('DemoSeeder: Seeded forms with responses');
    }

    private function seedBooks(): void
    {
        $theologyCat = $this->categories['book_theology'] ?? null;
        $livingCat = $this->categories['book_christian-living'] ?? null;
        $studyCat = $this->categories['book_bible-study'] ?? null;
        $youthCat = $this->categories['book_youth'] ?? null;

        $books = [
            ['title' => 'Mere Christianity', 'author' => 'C.S. Lewis', 'isbn' => '9780060652920', 'publisher' => 'HarperOne', 'description' => 'A classic exploration of the rational basis for Christianity, drawn from Lewis\'s wartime BBC radio talks.', 'category_id' => $theologyCat?->id, 'total_copies' => 3, 'available_copies' => 2, 'location' => 'Shelf A-1'],
            ['title' => 'The Purpose Driven Life', 'author' => 'Rick Warren', 'isbn' => '9780310205715', 'publisher' => 'Zondervan', 'description' => 'A 40-day journey to discovering God\'s purpose for your life.', 'category_id' => $livingCat?->id, 'total_copies' => 4, 'available_copies' => 3, 'location' => 'Shelf B-2'],
            ['title' => 'Knowing God', 'author' => 'J.I. Packer', 'isbn' => '9780830816507', 'publisher' => 'IVP Books', 'description' => 'A beloved classic that explores the nature and character of God.', 'category_id' => $theologyCat?->id, 'total_copies' => 2, 'available_copies' => 1, 'location' => 'Shelf A-2'],
            ['title' => 'Radical', 'author' => 'David Platt', 'isbn' => '9781601422217', 'publisher' => 'Multnomah', 'description' => 'A challenge to take back your faith from the American Dream.', 'category_id' => $livingCat?->id, 'total_copies' => 3, 'available_copies' => 3, 'location' => 'Shelf B-3'],
            ['title' => 'How to Read the Bible for All Its Worth', 'author' => 'Gordon Fee & Douglas Stuart', 'isbn' => '9780310517825', 'publisher' => 'Zondervan', 'description' => 'A practical guide to reading and interpreting the Bible with greater understanding.', 'category_id' => $studyCat?->id, 'total_copies' => 5, 'available_copies' => 4, 'location' => 'Shelf C-1'],
            ['title' => 'Do Hard Things', 'author' => 'Alex & Brett Harris', 'isbn' => '9781601421128', 'publisher' => 'Multnomah', 'description' => 'A teenage rebellion against low expectations -- inspiring young people to make a difference.', 'category_id' => $youthCat?->id, 'total_copies' => 3, 'available_copies' => 2, 'location' => 'Shelf D-1'],
            ['title' => 'Systematic Theology', 'author' => 'Wayne Grudem', 'isbn' => '9780310286707', 'publisher' => 'Zondervan', 'description' => 'A comprehensive introduction to systematic theology accessible to everyday Christians.', 'category_id' => $theologyCat?->id, 'total_copies' => 2, 'available_copies' => 2, 'location' => 'Shelf A-3'],
            ['title' => 'Boundaries', 'author' => 'Henry Cloud & John Townsend', 'isbn' => '9780310351801', 'publisher' => 'Zondervan', 'description' => 'When to say yes, how to say no to take control of your life.', 'category_id' => $livingCat?->id, 'total_copies' => 3, 'available_copies' => 1, 'location' => 'Shelf B-1'],
        ];

        foreach ($books as $data) {
            $book = Book::firstOrCreate(
                ['slug' => Str::slug($data['title'])],
                array_merge($data, ['is_published' => true]),
            );

            // Active lendings for books with fewer available copies
            if ($book->available_copies < $book->total_copies) {
                $borrowers = ['jessica', 'daniel', 'matt', 'lauren', 'chris'];
                $borrowed = $book->total_copies - $book->available_copies;
                for ($i = 0; $i < $borrowed && $i < count($borrowers); $i++) {
                    if (! isset($this->users[$borrowers[$i]])) {
                        continue;
                    }
                    BookLending::firstOrCreate(
                        ['book_id' => $book->id, 'user_id' => $this->users[$borrowers[$i]]->id, 'returned_at' => null],
                        [
                            'borrowed_at' => now()->subDays(rand(3, 14)),
                            'due_at' => now()->addDays(rand(7, 21)),
                            'lent_by' => $this->users['sarah']->id,
                        ],
                    );
                }
            }
        }

        Log::info('DemoSeeder: Seeded books with lendings');
    }

    private function seedEvents(): void
    {
        $admin = $this->users['pastor'];
        $staff = $this->users['sarah'];
        $worshipCat = $this->categories['event_worship'] ?? null;
        $fellowshipCat = $this->categories['event_fellowship'] ?? null;
        $outreachCat = $this->categories['event_outreach'] ?? null;
        $youthCat = $this->categories['event_youth-events'] ?? null;
        $conferenceCat = $this->categories['event_conference'] ?? null;

        $events = [
            [
                'title' => 'Good Friday Service',
                'slug' => 'good-friday-service-2026',
                'description' => 'A reflective service of Scripture readings, hymns, and communion as we remember the sacrifice of Christ.',
                'body' => '<p>Join us for a solemn and meaningful Good Friday service as we walk through the final hours of Jesus\' life. The service will include Scripture readings, traditional hymns, a meditation by Pastor David, and communion.</p><p>Childcare is available for ages 0-5.</p>',
                'location' => 'Main Sanctuary',
                'starts_at' => now()->addDays(14)->setTime(19, 0),
                'ends_at' => now()->addDays(14)->setTime(20, 30),
                'is_all_day' => false,
                'recurrence' => EventRecurrence::None,
                'max_attendees' => null,
                'is_published' => true,
                'category_id' => $worshipCat?->id,
                'created_by' => $admin->id,
            ],
            [
                'title' => 'Church Potluck & Game Night',
                'slug' => 'potluck-game-night-april',
                'description' => 'Bring a dish to share and your favorite board game for an evening of food and fellowship.',
                'body' => '<h2>Monthly Potluck</h2><p>Our monthly potluck and game night is a great opportunity to connect with your church family in a relaxed setting. Bring a dish to share (enough for 8-10 people) and your favorite board game or card game.</p><p>Drinks and paper products will be provided.</p>',
                'location' => 'Fellowship Hall',
                'starts_at' => now()->addDays(10)->setTime(18, 0),
                'ends_at' => now()->addDays(10)->setTime(21, 0),
                'is_all_day' => false,
                'recurrence' => EventRecurrence::Monthly,
                'max_attendees' => 80,
                'is_published' => true,
                'category_id' => $fellowshipCat?->id,
                'created_by' => $staff->id,
            ],
            [
                'title' => 'Community Outreach Day',
                'slug' => 'community-outreach-day-april',
                'description' => 'Serve our neighbors through yard work, home repairs, and meal delivery.',
                'body' => '<p>Our quarterly Community Outreach Day is a chance to be the hands and feet of Jesus in our neighborhood. Teams will be assigned to various projects including yard work for elderly neighbors, minor home repairs, and delivering meals to the homebound.</p><p>Meet at the church parking lot at 8 AM. Lunch will be provided. Please wear work clothes and closed-toe shoes.</p>',
                'location' => 'Church Parking Lot (meet here)',
                'starts_at' => now()->addDays(23)->setTime(8, 0),
                'ends_at' => now()->addDays(23)->setTime(14, 0),
                'is_all_day' => false,
                'recurrence' => EventRecurrence::None,
                'max_attendees' => 50,
                'is_published' => true,
                'category_id' => $outreachCat?->id,
                'created_by' => $this->users['robert']->id,
            ],
            [
                'title' => 'Youth Worship Night',
                'slug' => 'youth-worship-night-march',
                'description' => 'An evening of worship, prayer, and fellowship for students grades 6-12.',
                'body' => '<p>A special worship night for our youth group. Come ready to sing, pray, and encounter God together. Snacks will be served afterwards.</p>',
                'location' => 'Youth Building',
                'starts_at' => now()->addDays(5)->setTime(19, 0),
                'ends_at' => now()->addDays(5)->setTime(21, 0),
                'is_all_day' => false,
                'recurrence' => EventRecurrence::None,
                'max_attendees' => 60,
                'is_published' => true,
                'category_id' => $youthCat?->id,
                'created_by' => $this->users['michael']->id,
            ],
            [
                'title' => 'Women\'s Conference: Rooted & Grounded',
                'slug' => 'womens-conference-2026',
                'description' => 'A two-day conference for women featuring worship, breakout sessions, and keynote speakers.',
                'body' => '<h2>Rooted & Grounded</h2><p>This year\'s women\'s conference will explore what it means to be rooted in Christ through Colossians 2:6-7. Featuring keynote speaker Lisa Harper, three breakout tracks, worship led by our women\'s worship team, and a Saturday brunch.</p>',
                'location' => 'Main Sanctuary & Fellowship Hall',
                'starts_at' => now()->addWeeks(6)->setTime(18, 0),
                'ends_at' => now()->addWeeks(6)->addDay()->setTime(15, 0),
                'is_all_day' => false,
                'recurrence' => EventRecurrence::None,
                'max_attendees' => 150,
                'is_published' => true,
                'category_id' => $conferenceCat?->id,
                'created_by' => $staff->id,
            ],
            [
                'title' => 'Men\'s Breakfast',
                'slug' => 'mens-breakfast-march',
                'description' => 'Monthly men\'s breakfast with guest speaker and fellowship.',
                'body' => '<p>Join the men of Grace Community for breakfast, fellowship, and a short devotional. This month\'s speaker is James Wilson sharing on "Leadership in the Home."</p>',
                'location' => 'Fellowship Hall',
                'starts_at' => now()->subDays(7)->setTime(7, 30),
                'ends_at' => now()->subDays(7)->setTime(9, 0),
                'is_all_day' => false,
                'recurrence' => EventRecurrence::Monthly,
                'max_attendees' => 40,
                'is_published' => true,
                'category_id' => $fellowshipCat?->id,
                'created_by' => $this->users['james']->id,
            ],
            [
                'title' => 'Vacation Bible School',
                'slug' => 'vbs-2026',
                'description' => 'Expedition Adventure! Five days of Bible stories, crafts, games, and songs for ages 4 through 5th grade.',
                'body' => '<h2>Expedition Adventure VBS</h2><p>Get ready for an incredible week of discovery! This year\'s Vacation Bible School theme takes kids on an expedition through the Bible, exploring five key stories of God\'s faithfulness.</p><ul><li><strong>When:</strong> June 9-13, 9:00 AM - 12:00 PM</li><li><strong>Ages:</strong> 4 years old through completed 5th grade</li><li><strong>Cost:</strong> Free!</li></ul><p>Volunteer registration is also open -- we need 30+ volunteers to make this week happen!</p>',
                'location' => 'Children\'s Wing & Fellowship Hall',
                'starts_at' => Carbon::create(2026, 6, 9, 9, 0),
                'ends_at' => Carbon::create(2026, 6, 13, 12, 0),
                'is_all_day' => false,
                'recurrence' => EventRecurrence::None,
                'max_attendees' => 100,
                'is_published' => true,
                'category_id' => $outreachCat?->id,
                'created_by' => $this->users['robert']->id,
            ],
        ];

        foreach ($events as $data) {
            $event = Event::firstOrCreate(['slug' => $data['slug']], $data);

            // Register attendees for upcoming events
            if (Carbon::parse($data['starts_at'])->isFuture()) {
                $pool = ['jessica', 'daniel', 'amanda', 'rachel', 'matt', 'lauren', 'andrew', 'sophia', 'nathan', 'grace'];
                $attendees = array_rand(array_flip($pool), rand(4, 8));
                foreach ($attendees as $key) {
                    if (! isset($this->users[$key])) {
                        continue;
                    }
                    EventRegistration::firstOrCreate(
                        ['event_id' => $event->id, 'user_id' => $this->users[$key]->id],
                        [
                            'name' => $this->users[$key]->name,
                            'email' => $this->users[$key]->email,
                            'status' => RegistrationStatus::Registered,
                            'registered_at' => now()->subDays(rand(0, 7)),
                        ],
                    );
                }

                // Add a guest registration to the potluck
                if ($event->slug === 'potluck-game-night-april') {
                    EventRegistration::firstOrCreate(
                        ['event_id' => $event->id, 'email' => 'newcomer@email.com'],
                        [
                            'name' => 'Sarah & Tom Peterson',
                            'email' => 'newcomer@email.com',
                            'phone' => '(555) 999-0000',
                            'status' => RegistrationStatus::Registered,
                            'registered_at' => now()->subDays(2),
                        ],
                    );
                }
            }
        }

        Log::info('DemoSeeder: Seeded events with registrations');
    }

    private function seedMinistries(): void
    {
        $memberKeys = ['jessica', 'daniel', 'amanda', 'chris', 'rachel', 'matt', 'lauren', 'andrew', 'sophia', 'nathan', 'grace', 'ben', 'olivia', 'kevin'];

        $ministries = [
            [
                'name' => 'Worship Ministry',
                'description' => 'Leading the congregation in praise and worship through music, song, and creative arts.',
                'body' => '<p>Our worship ministry exists to create an atmosphere where people can encounter God through music and creative expression. We have teams for vocals, instruments, sound, lighting, and media.</p>',
                'leader_key' => 'emily',
                'meeting_schedule' => 'Thursdays at 7:00 PM (rehearsal), Sundays at 8:00 AM (sound check)',
                'meeting_location' => 'Main Sanctuary',
                'groups' => [
                    ['name' => 'Sunday Morning Worship Team', 'meeting_day' => 'Thursday', 'meeting_time' => '19:00', 'max_members' => 15],
                    ['name' => 'Youth Worship Band', 'meeting_day' => 'Wednesday', 'meeting_time' => '17:30', 'max_members' => 8],
                ],
            ],
            [
                'name' => 'Youth Ministry',
                'description' => 'Empowering the next generation to follow Jesus through relevant teaching, mentoring, and community.',
                'body' => '<p>Our youth ministry serves students in grades 6-12 through weekly gatherings, small groups, retreats, and mission trips. We believe every student matters and that the teenage years are a critical time for faith formation.</p>',
                'leader_key' => 'michael',
                'meeting_schedule' => 'Wednesdays 6:30-8:30 PM, Sundays 10:30 AM',
                'meeting_location' => 'Youth Building',
                'groups' => [
                    ['name' => 'Middle School Group', 'meeting_day' => 'Wednesday', 'meeting_time' => '18:30', 'max_members' => 20],
                    ['name' => 'High School Group', 'meeting_day' => 'Wednesday', 'meeting_time' => '18:30', 'max_members' => 20],
                ],
            ],
            [
                'name' => 'Children\'s Ministry',
                'description' => 'Nurturing children from nursery through 5th grade in their faith journey.',
                'body' => '<p>We believe children are not just the future of the church -- they are the church today. Our children\'s ministry provides a safe, fun, and engaging environment where kids can learn about God\'s love.</p>',
                'leader_key' => 'robert',
                'meeting_schedule' => 'Sundays during all service times',
                'meeting_location' => 'Children\'s Wing',
                'groups' => [
                    ['name' => 'Nursery (0-2)', 'meeting_day' => 'Sunday', 'meeting_time' => '08:00', 'max_members' => 10],
                    ['name' => 'Preschool (3-5)', 'meeting_day' => 'Sunday', 'meeting_time' => '10:30', 'max_members' => 15],
                    ['name' => 'Elementary (K-5th)', 'meeting_day' => 'Sunday', 'meeting_time' => '10:30', 'max_members' => 25],
                ],
            ],
            [
                'name' => 'Outreach & Missions',
                'description' => 'Serving our local community and supporting global missions through hands-on service and strategic partnerships.',
                'body' => '<p>From local food drives to international mission trips, our outreach ministry is committed to demonstrating the love of Christ through practical action.</p>',
                'leader_key' => 'james',
                'meeting_schedule' => '1st Monday of each month at 7:00 PM',
                'meeting_location' => 'Conference Room',
                'groups' => [
                    ['name' => 'Local Outreach Team', 'meeting_day' => 'Saturday', 'meeting_time' => '09:00', 'max_members' => 30],
                    ['name' => 'Missions Committee', 'meeting_day' => 'Monday', 'meeting_time' => '19:00', 'max_members' => 8],
                ],
            ],
            [
                'name' => 'Men\'s Ministry',
                'description' => 'Building godly men through fellowship, accountability, and biblical teaching.',
                'body' => '<p>Our men\'s ministry provides a place where men can grow in their faith, build authentic relationships, and become the spiritual leaders God has called them to be.</p>',
                'leader_key' => 'james',
                'meeting_schedule' => '2nd Saturday of each month at 7:30 AM, Tuesdays at 6:30 AM',
                'meeting_location' => 'Fellowship Hall',
                'groups' => [
                    ['name' => 'Tuesday Morning Bible Study', 'meeting_day' => 'Tuesday', 'meeting_time' => '06:30', 'max_members' => 12],
                ],
            ],
            [
                'name' => 'Women\'s Ministry',
                'description' => 'Encouraging women to grow in faith, community, and service through Bible studies, events, and mentoring.',
                'body' => '<p>Our women\'s ministry creates opportunities for women of all ages and stages to connect, grow, and serve together.</p>',
                'leader_key' => 'emily',
                'meeting_schedule' => 'Tuesdays 9:30 AM and Thursdays 7:00 PM',
                'meeting_location' => 'Room 201',
                'groups' => [
                    ['name' => 'Morning Bible Study', 'meeting_day' => 'Tuesday', 'meeting_time' => '09:30', 'max_members' => 20],
                    ['name' => 'Evening Bible Study', 'meeting_day' => 'Thursday', 'meeting_time' => '19:00', 'max_members' => 20],
                ],
            ],
            [
                'name' => 'Hospitality Team',
                'description' => 'Creating a warm and welcoming environment for everyone who walks through our doors.',
                'body' => '<p>First impressions matter. Our hospitality team serves as greeters, ushers, and cafe volunteers to ensure every visitor feels genuinely welcome.</p>',
                'leader_key' => 'sarah',
                'meeting_schedule' => 'Sundays (rotating schedule)',
                'meeting_location' => 'Church Lobby',
                'groups' => [],
            ],
            [
                'name' => 'Elder Board',
                'description' => 'The governing body responsible for spiritual oversight and strategic direction of the church.',
                'body' => '<p>Our elders serve as the spiritual shepherds of Grace Community Church, providing leadership, accountability, and pastoral care.</p>',
                'leader_key' => 'pastor',
                'meeting_schedule' => '3rd Tuesday of each month at 7:00 PM',
                'meeting_location' => 'Conference Room',
                'is_governance_body' => true,
                'groups' => [],
            ],
        ];

        foreach ($ministries as $index => $data) {
            $leader = $this->users[$data['leader_key']] ?? $this->users['pastor'];
            $ministry = Ministry::firstOrCreate(
                ['slug' => Str::slug($data['name'])],
                [
                    'name' => $data['name'],
                    'description' => $data['description'],
                    'body' => $data['body'],
                    'leader_id' => $leader->id,
                    'is_active' => true,
                    'is_governance_body' => $data['is_governance_body'] ?? false,
                    'sort_order' => $index,
                    'meeting_schedule' => $data['meeting_schedule'],
                    'meeting_location' => $data['meeting_location'],
                ],
            );

            // Add leader as ministry member
            MinistryMember::firstOrCreate(
                ['user_id' => $leader->id, 'ministry_id' => $ministry->id],
                ['role' => MinistryRole::Leader, 'joined_at' => now()->subMonths(rand(6, 24))],
            );

            // Add random members
            $shuffled = collect($memberKeys)->shuffle()->take(rand(3, 7));
            foreach ($shuffled as $key) {
                if (! isset($this->users[$key])) {
                    continue;
                }
                MinistryMember::firstOrCreate(
                    ['user_id' => $this->users[$key]->id, 'ministry_id' => $ministry->id],
                    [
                        'role' => collect([MinistryRole::Member, MinistryRole::Volunteer])->random(),
                        'joined_at' => now()->subDays(rand(30, 365)),
                    ],
                );
            }

            // Create groups
            foreach ($data['groups'] as $groupData) {
                $group = MinistryGroup::firstOrCreate(
                    ['slug' => Str::slug($groupData['name']), 'ministry_id' => $ministry->id],
                    [
                        'name' => $groupData['name'],
                        'description' => "A group within {$data['name']}.",
                        'ministry_id' => $ministry->id,
                        'leader_id' => $leader->id,
                        'max_members' => $groupData['max_members'],
                        'meeting_day' => $groupData['meeting_day'],
                        'meeting_time' => $groupData['meeting_time'],
                        'meeting_location' => $data['meeting_location'],
                        'is_active' => true,
                    ],
                );

                $groupMembers = collect($memberKeys)->shuffle()->take(rand(2, 5));
                foreach ($groupMembers as $key) {
                    if (! isset($this->users[$key])) {
                        continue;
                    }
                    GroupMember::firstOrCreate(
                        ['user_id' => $this->users[$key]->id, 'ministry_group_id' => $group->id],
                        ['joined_at' => now()->subDays(rand(14, 180))],
                    );
                }
            }
        }

        Log::info('DemoSeeder: Seeded ministries with groups and members');
    }

    private function seedVolunteerRoles(): void
    {
        $worshipMinistry = Ministry::where('slug', 'worship-ministry')->first();
        $hospitalityMinistry = Ministry::where('slug', 'hospitality-team')->first();
        $childrenMinistry = Ministry::where('slug', 'childrens-ministry')->first();

        $roles = [
            ['name' => 'Worship Leader', 'description' => 'Lead the congregation in musical worship during services.', 'ministry_id' => $worshipMinistry?->id],
            ['name' => 'Sound Technician', 'description' => 'Operate the sound board and audio equipment during services.', 'ministry_id' => $worshipMinistry?->id],
            ['name' => 'Projection Operator', 'description' => 'Manage lyrics, slides, and media presentation during services.', 'ministry_id' => $worshipMinistry?->id],
            ['name' => 'Greeter', 'description' => 'Welcome attendees at the doors and help visitors find their way.', 'ministry_id' => $hospitalityMinistry?->id],
            ['name' => 'Usher', 'description' => 'Assist with seating, offering collection, and crowd flow.', 'ministry_id' => $hospitalityMinistry?->id],
            ['name' => 'Coffee Bar Volunteer', 'description' => 'Prepare and serve beverages at the church cafe.', 'ministry_id' => $hospitalityMinistry?->id],
            ['name' => 'Nursery Volunteer', 'description' => 'Care for infants and toddlers during worship services.', 'ministry_id' => $childrenMinistry?->id],
            ['name' => 'Children\'s Teacher', 'description' => 'Teach age-appropriate Bible lessons during Sunday services.', 'ministry_id' => $childrenMinistry?->id],
        ];

        $sundayMain = $this->serviceTimes['sunday-main-service'] ?? ServiceTime::first();

        foreach ($roles as $roleData) {
            $role = VolunteerRole::firstOrCreate(
                ['slug' => Str::slug($roleData['name'])],
                array_merge($roleData, ['is_active' => true]),
            );

            // Schedule volunteers for next 3 Sundays
            $volunteers = ['emily', 'jessica', 'daniel', 'amanda', 'chris', 'rachel', 'matt', 'lauren', 'nathan'];
            for ($week = 0; $week < 3; $week++) {
                $sunday = now()->next('Sunday')->addWeeks($week);
                $volunteer = $volunteers[array_rand($volunteers)];
                if (! isset($this->users[$volunteer]) || ! $sundayMain) {
                    continue;
                }
                VolunteerSchedule::firstOrCreate(
                    ['volunteer_role_id' => $role->id, 'scheduled_date' => $sunday->toDateString(), 'service_time_id' => $sundayMain->id],
                    [
                        'user_id' => $this->users[$volunteer]->id,
                        'status' => $week === 0 ? ScheduleStatus::Confirmed : ScheduleStatus::Scheduled,
                        'scheduled_by' => $this->users['sarah']->id,
                    ],
                );
            }
        }

        Log::info('DemoSeeder: Seeded volunteer roles with schedules');
    }

    private function seedVisitors(): void
    {
        $staff = $this->users['sarah'];

        $visitors = [
            [
                'name' => 'Thomas & Maria Garcia',
                'email' => 'garcia.family@email.com',
                'phone' => '(555) 234-5678',
                'address' => '142 Maple Drive, Springfield',
                'first_visit_date' => now()->subDays(3)->toDateString(),
                'how_heard' => 'Friend invited us',
                'prayer_requests' => 'Praying for a smooth transition -- we just moved to the area.',
                'notes' => 'Young family with two kids (ages 4 and 7). Expressed interest in children\'s ministry.',
                'follow_up_status' => FollowUpStatus::Contacted,
                'assigned_to' => $staff->id,
            ],
            [
                'name' => 'Lisa Patel',
                'email' => 'lisa.patel@email.com',
                'phone' => '(555) 345-6789',
                'address' => '89 Oak Lane, Springfield',
                'first_visit_date' => now()->subDays(10)->toDateString(),
                'how_heard' => 'Drove by and saw the sign',
                'prayer_requests' => null,
                'notes' => 'Single professional, mid-30s. Visited the Sunday main service. Seemed engaged during worship.',
                'follow_up_status' => FollowUpStatus::FollowUp,
                'assigned_to' => $staff->id,
            ],
            [
                'name' => 'Robert & Susan Whitfield',
                'email' => 'r.whitfield@email.com',
                'phone' => '(555) 456-7890',
                'address' => '305 Birch Court, Springfield',
                'first_visit_date' => now()->subWeeks(3)->toDateString(),
                'how_heard' => 'Found the church website',
                'prayer_requests' => 'Robert is recovering from knee surgery.',
                'notes' => 'Retired couple, relocated from Ohio to be closer to grandchildren. Looking for a church home.',
                'follow_up_status' => FollowUpStatus::Connected,
                'assigned_to' => $this->users['james']->id,
            ],
            [
                'name' => 'Marcus Johnson',
                'email' => 'marcus.j@email.com',
                'phone' => '(555) 567-8901',
                'address' => null,
                'first_visit_date' => now()->subDays(1)->toDateString(),
                'how_heard' => 'Community outreach event',
                'prayer_requests' => 'Going through a difficult season. Asking for prayer for direction.',
                'notes' => 'First time visitor, came alone. Filled out a prayer card. Seemed interested in the men\'s group.',
                'follow_up_status' => FollowUpStatus::New,
                'assigned_to' => null,
            ],
            [
                'name' => 'Jennifer & Mark Stevens',
                'email' => 'jstevens@email.com',
                'phone' => '(555) 678-9012',
                'address' => '17 Elm Street, Springfield',
                'first_visit_date' => now()->subMonths(2)->toDateString(),
                'how_heard' => 'Invited by Amanda Foster',
                'prayer_requests' => null,
                'notes' => 'Family of four. Have been attending regularly since first visit. Both interested in volunteering.',
                'follow_up_status' => FollowUpStatus::Connected,
                'assigned_to' => $staff->id,
            ],
        ];

        foreach ($visitors as $data) {
            $visitor = Visitor::firstOrCreate(
                ['email' => $data['email']],
                $data,
            );

            // Follow-ups for non-new visitors
            if ($visitor->follow_up_status !== FollowUpStatus::New) {
                VisitorFollowUp::firstOrCreate(
                    ['visitor_id' => $visitor->id, 'type' => FollowUpType::Email],
                    [
                        'user_id' => $visitor->assigned_to ?? $staff->id,
                        'notes' => 'Sent welcome email with info about upcoming events and ministries.',
                        'followed_up_at' => Carbon::parse($visitor->first_visit_date)->addDays(2),
                    ],
                );

                if (in_array($visitor->follow_up_status, [FollowUpStatus::FollowUp, FollowUpStatus::Connected])) {
                    VisitorFollowUp::firstOrCreate(
                        ['visitor_id' => $visitor->id, 'type' => FollowUpType::Call],
                        [
                            'user_id' => $visitor->assigned_to ?? $staff->id,
                            'notes' => 'Called to check in and answer questions. Invited to upcoming fellowship event.',
                            'followed_up_at' => Carbon::parse($visitor->first_visit_date)->addDays(5),
                        ],
                    );
                }
            }
        }

        Log::info('DemoSeeder: Seeded visitors with follow-ups');
    }

    private function seedDocuments(): void
    {
        $admin = $this->users['pastor'];
        $staff = $this->users['sarah'];
        $policiesCat = $this->categories['document_policies'] ?? null;
        $bulletinsCat = $this->categories['document_bulletins'] ?? null;
        $reportsCat = $this->categories['document_reports'] ?? null;

        $documents = [
            ['title' => 'Church Constitution & Bylaws', 'description' => 'The governing document of Grace Community Church, last amended January 2025.', 'visibility' => DocumentVisibility::Public, 'category_id' => $policiesCat?->id, 'uploaded_by' => $admin->id],
            ['title' => 'Child Protection Policy', 'description' => 'Policies and procedures for ensuring the safety of children in all church programs.', 'visibility' => DocumentVisibility::Public, 'category_id' => $policiesCat?->id, 'uploaded_by' => $admin->id],
            ['title' => 'Sunday Bulletin - March 16, 2026', 'description' => 'This week\'s worship bulletin with announcements and prayer requests.', 'visibility' => DocumentVisibility::Public, 'category_id' => $bulletinsCat?->id, 'uploaded_by' => $staff->id],
            ['title' => 'Sunday Bulletin - March 9, 2026', 'description' => 'Last week\'s worship bulletin.', 'visibility' => DocumentVisibility::Public, 'category_id' => $bulletinsCat?->id, 'uploaded_by' => $staff->id],
            ['title' => 'Annual Report 2025', 'description' => 'Year-end report covering ministry highlights, financial summary, and vision for 2026.', 'visibility' => DocumentVisibility::Members, 'category_id' => $reportsCat?->id, 'uploaded_by' => $admin->id],
            ['title' => 'Staff Handbook', 'description' => 'Policies and procedures for church staff members.', 'visibility' => DocumentVisibility::Admin, 'category_id' => $policiesCat?->id, 'uploaded_by' => $admin->id],
            ['title' => 'Financial Report - Q1 2026', 'description' => 'First quarter financial report including income, expenses, and budget status.', 'visibility' => DocumentVisibility::Admin, 'category_id' => $reportsCat?->id, 'uploaded_by' => $staff->id],
            ['title' => 'Facility Use Agreement', 'description' => 'Agreement form for external groups requesting use of church facilities.', 'visibility' => DocumentVisibility::Public, 'category_id' => $policiesCat?->id, 'uploaded_by' => $staff->id],
        ];

        foreach ($documents as $data) {
            Document::firstOrCreate(
                ['slug' => Str::slug($data['title'])],
                array_merge($data, ['is_published' => true]),
            );
        }

        Log::info('DemoSeeder: Seeded documents');
    }

    private function seedHeroSlides(): void
    {
        $slides = [
            [
                'title' => 'Welcome Home',
                'subtitle' => 'A place where faith grows, community thrives, and everyone belongs.',
                'link_url' => '/visit',
                'link_text' => 'Plan Your Visit',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'title' => 'Unshakeable Faith',
                'subtitle' => 'Join us for our current sermon series through the book of James.',
                'link_url' => '/sermons',
                'link_text' => 'Watch Sermons',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'title' => 'Women\'s Conference 2026',
                'subtitle' => 'Rooted & Grounded -- Register today for this transformative weekend.',
                'link_url' => '/events',
                'link_text' => 'Learn More',
                'sort_order' => 3,
                'is_active' => true,
            ],
        ];

        foreach ($slides as $data) {
            HeroSlide::firstOrCreate(['title' => $data['title']], $data);
        }

        Log::info('DemoSeeder: Seeded hero slides');
    }

    private function seedMenuItems(): void
    {
        $aboutPage = \App\Models\Page::where('slug', 'about-us')->first();
        $beliefPage = \App\Models\Page::where('slug', 'what-we-believe')->first();
        $contactPage = \App\Models\Page::where('slug', 'contact-us')->first();
        $leadershipPage = \App\Models\Page::where('slug', 'leadership')->first();
        $givePage = \App\Models\Page::where('slug', 'give')->first();

        $items = [
            ['label' => 'About', 'type' => MenuItemType::Page, 'page_id' => $aboutPage?->id, 'sort_order' => 1],
            ['label' => 'Sermons', 'type' => MenuItemType::CustomUrl, 'url' => '/sermons', 'sort_order' => 2],
            ['label' => 'Events', 'type' => MenuItemType::CustomUrl, 'url' => '/events', 'sort_order' => 3],
            ['label' => 'Ministries', 'type' => MenuItemType::CustomUrl, 'url' => '/ministries', 'sort_order' => 4],
            ['label' => 'Give', 'type' => MenuItemType::Page, 'page_id' => $givePage?->id, 'sort_order' => 5],
        ];

        foreach ($items as $data) {
            $parent = MenuItem::firstOrCreate(
                ['label' => $data['label'], 'parent_id' => null],
                array_merge($data, ['target' => MenuItemTarget::Self, 'is_active' => true]),
            );

            // Add sub-items under About
            if ($data['label'] === 'About') {
                $children = [
                    ['label' => 'Our Story', 'type' => MenuItemType::Page, 'page_id' => $aboutPage?->id],
                    ['label' => 'What We Believe', 'type' => MenuItemType::Page, 'page_id' => $beliefPage?->id],
                    ['label' => 'Contact Us', 'type' => MenuItemType::Page, 'page_id' => $contactPage?->id],
                    ['label' => 'Leadership', 'type' => MenuItemType::Page, 'page_id' => $leadershipPage?->id],
                ];

                foreach ($children as $cIndex => $child) {
                    MenuItem::firstOrCreate(
                        ['label' => $child['label'], 'parent_id' => $parent->id],
                        array_merge($child, [
                            'parent_id' => $parent->id,
                            'target' => MenuItemTarget::Self,
                            'sort_order' => $cIndex,
                            'is_active' => true,
                        ]),
                    );
                }
            }
        }

        // Clear menu cache
        cache()->forget('public_navigation');

        Log::info('DemoSeeder: Seeded menu items');
    }

    private function seedBenevolence(): void
    {
        $admin = $this->users['pastor'];
        $staff = $this->users['sarah'];

        // Approved and disbursed request
        $request1 = BenevolentRequest::firstOrCreate(
            ['requester_name' => 'Mary Henderson', 'requester_contact' => '(555) 111-2222'],
            [
                'category' => BenevolentCategory::Utilities,
                'description' => 'Single mother of three who lost her job two months ago. Behind on electric bill and facing disconnection this Friday.',
                'amount_requested' => 450.00,
                'urgency' => BenevolentUrgency::High,
                'status' => BenevolentStatus::Disbursed,
                'amount_approved' => 450.00,
                'final_decision_by' => $admin->id,
                'final_decision_at' => now()->subDays(5),
                'final_decision_notes' => 'Approved in full. Connected member with job resources through outreach ministry.',
                'created_by' => $staff->id,
            ],
        );

        BenevolentReview::firstOrCreate(
            ['benevolent_request_id' => $request1->id, 'user_id' => $admin->id],
            [
                'recommendation' => ReviewRecommendation::Approve,
                'amount_recommended' => 450.00,
                'comments' => 'Verified situation through home visit. Family is in genuine need. Recommend full approval.',
                'reviewed_at' => now()->subDays(6),
            ],
        );

        BenevolentDisbursement::firstOrCreate(
            ['benevolent_request_id' => $request1->id, 'amount' => 450.00],
            [
                'method' => DisbursementMethod::DirectPayment,
                'reference_number' => 'BEN-2026-001',
                'disbursed_by' => $staff->id,
                'disbursed_at' => now()->subDays(4),
                'notes' => 'Payment made directly to Springfield Electric Company. Account #4421.',
            ],
        );

        // Pending request
        BenevolentRequest::firstOrCreate(
            ['requester_name' => 'James Carter', 'requester_contact' => '(555) 333-4444'],
            [
                'category' => BenevolentCategory::Medical,
                'description' => 'Unexpected emergency room visit resulted in $1,200 in medical bills. Has insurance but deductible is unaffordable on fixed income.',
                'amount_requested' => 800.00,
                'urgency' => BenevolentUrgency::Medium,
                'status' => BenevolentStatus::Pending,
                'created_by' => $staff->id,
            ],
        );

        // Under review with partial recommendation
        $request3 = BenevolentRequest::firstOrCreate(
            ['requester_name' => 'Patricia Simmons', 'requester_contact' => '(555) 555-6666'],
            [
                'category' => BenevolentCategory::Housing,
                'description' => 'Rent increase has made current housing unaffordable. Seeking assistance for one month\'s rent while searching for more affordable housing.',
                'amount_requested' => 1200.00,
                'urgency' => BenevolentUrgency::High,
                'status' => BenevolentStatus::UnderReview,
                'created_by' => $admin->id,
            ],
        );

        BenevolentReview::firstOrCreate(
            ['benevolent_request_id' => $request3->id, 'user_id' => $this->users['james']->id],
            [
                'recommendation' => ReviewRecommendation::Approve,
                'amount_recommended' => 1000.00,
                'comments' => 'Recommend partial approval of $1,000. Suggest connecting with local housing resources for long-term solution.',
                'reviewed_at' => now()->subDays(1),
            ],
        );

        // Denied request
        BenevolentRequest::firstOrCreate(
            ['requester_name' => 'Derek Williams', 'requester_contact' => '(555) 777-8888'],
            [
                'category' => BenevolentCategory::Financial,
                'description' => 'Requesting help with credit card debt accumulated from vacation spending.',
                'amount_requested' => 3000.00,
                'urgency' => BenevolentUrgency::Low,
                'status' => BenevolentStatus::Denied,
                'final_decision_by' => $admin->id,
                'final_decision_at' => now()->subWeeks(2),
                'final_decision_notes' => 'Does not meet benevolence fund criteria. Referred to financial counseling ministry.',
                'created_by' => $staff->id,
            ],
        );

        // Food assistance - closed
        $request5 = BenevolentRequest::firstOrCreate(
            ['requester_name' => 'Rosa Martinez', 'requester_contact' => '(555) 999-0000'],
            [
                'category' => BenevolentCategory::Food,
                'description' => 'Family of five experiencing food insecurity after primary earner was injured on the job. Workers comp claim is pending.',
                'amount_requested' => 300.00,
                'urgency' => BenevolentUrgency::High,
                'status' => BenevolentStatus::Closed,
                'amount_approved' => 300.00,
                'final_decision_by' => $admin->id,
                'final_decision_at' => now()->subWeeks(3),
                'final_decision_notes' => 'Approved. Coordinated with food pantry ministry for ongoing support until workers comp is resolved.',
                'created_by' => $staff->id,
            ],
        );

        BenevolentDisbursement::firstOrCreate(
            ['benevolent_request_id' => $request5->id, 'amount' => 300.00],
            [
                'method' => DisbursementMethod::GiftCard,
                'reference_number' => 'BEN-2026-002',
                'disbursed_by' => $staff->id,
                'disbursed_at' => now()->subWeeks(3)->addDay(),
                'notes' => 'Grocery store gift cards ($100 x 3) provided. Family also connected with weekly food pantry.',
            ],
        );

        Log::info('DemoSeeder: Seeded benevolence requests, reviews, and disbursements');
    }

    private function seedCounseling(): void
    {
        $admin = $this->users['pastor'];
        $counselor = $this->users['counselor'];

        // Active individual counseling case (assigned to counselor)
        $case1 = CounselingCase::firstOrCreate(
            ['case_number' => 'CC-2026-001'],
            [
                'person_name' => 'Anonymous Member A',
                'person_contact' => '(555) 000-1111',
                'person_email' => 'confidential@example.com',
                'case_type' => CaseType::Individual,
                'status' => CaseStatus::Active,
                'presenting_issue' => 'Struggling with anxiety and panic attacks that have intensified over the past three months following a job loss.',
                'background_notes' => 'Member of the church for 5 years. No prior counseling history. Strong support network through small group.',
                'referral_source' => 'Self-referred after speaking with Pastor David',
                'assigned_counselor_id' => $counselor->id,
                'opened_by' => $admin->id,
                'opened_at' => now()->subWeeks(4),
            ],
        );

        CounselingSession::firstOrCreate(
            ['counseling_case_id' => $case1->id, 'session_date' => now()->subWeeks(3)->toDateString()],
            [
                'counselor_id' => $counselor->id,
                'duration_minutes' => 60,
                'session_type' => SessionType::InPerson,
                'notes' => 'Initial intake session. Discussed presenting concerns, history, and goals. Client is motivated and engaged.',
                'mood_rating' => 4,
                'progress_notes' => 'Established rapport. Introduced breathing exercises for acute anxiety episodes.',
                'next_session_date' => now()->subWeeks(2)->toDateString(),
            ],
        );

        CounselingSession::firstOrCreate(
            ['counseling_case_id' => $case1->id, 'session_date' => now()->subWeeks(2)->toDateString()],
            [
                'counselor_id' => $counselor->id,
                'duration_minutes' => 50,
                'session_type' => SessionType::InPerson,
                'notes' => 'Follow-up session. Client reports using breathing exercises with some success. Discussed cognitive patterns around worst-case thinking.',
                'mood_rating' => 5,
                'progress_notes' => 'Improvement noted. Introduced thought journaling. Client engaged well with biblical framework of casting anxieties on God (1 Peter 5:7).',
                'next_session_date' => now()->subWeeks(1)->toDateString(),
            ],
        );

        CounselingSession::firstOrCreate(
            ['counseling_case_id' => $case1->id, 'session_date' => now()->subWeeks(1)->toDateString()],
            [
                'counselor_id' => $counselor->id,
                'duration_minutes' => 50,
                'session_type' => SessionType::InPerson,
                'notes' => 'Third session. Client reports reduced frequency of panic attacks (from daily to 2-3 per week). Thought journal revealing patterns of catastrophizing.',
                'mood_rating' => 6,
                'progress_notes' => 'Steady improvement. Beginning to challenge automatic negative thoughts. Assigned reading: Psalm 46 meditation.',
                'next_session_date' => now()->addWeeks(1)->toDateString(),
            ],
        );

        CounselingGoal::firstOrCreate(
            ['counseling_case_id' => $case1->id, 'title' => 'Develop anxiety management toolkit'],
            [
                'description' => 'Learn and practice at least three evidence-based techniques for managing anxiety symptoms.',
                'target_date' => now()->addWeeks(4)->toDateString(),
                'status' => GoalStatus::InProgress,
                'priority' => 1,
                'created_by' => $counselor->id,
            ],
        );

        CounselingGoal::firstOrCreate(
            ['counseling_case_id' => $case1->id, 'title' => 'Resume regular daily routine'],
            [
                'description' => 'Establish a consistent daily schedule including exercise, devotional time, and social engagement.',
                'target_date' => now()->addWeeks(6)->toDateString(),
                'status' => GoalStatus::Active,
                'priority' => 2,
                'created_by' => $counselor->id,
            ],
        );

        // Pre-marital counseling case (assigned to pastor)
        $case2 = CounselingCase::firstOrCreate(
            ['case_number' => 'CC-2026-002'],
            [
                'person_name' => 'Couple B (Pre-Marital)',
                'person_contact' => '(555) 000-2222',
                'person_email' => 'couple.b@example.com',
                'case_type' => CaseType::PreMarital,
                'status' => CaseStatus::Active,
                'presenting_issue' => 'Engaged couple seeking pre-marital counseling before their August wedding.',
                'background_notes' => 'Both are active church members. Dating for two years, engaged for three months. No significant conflict areas identified.',
                'referral_source' => 'Required as part of church wedding policy',
                'assigned_counselor_id' => $admin->id,
                'opened_by' => $admin->id,
                'opened_at' => now()->subWeeks(2),
            ],
        );

        CounselingSession::firstOrCreate(
            ['counseling_case_id' => $case2->id, 'session_date' => now()->subWeeks(1)->toDateString()],
            [
                'counselor_id' => $admin->id,
                'duration_minutes' => 75,
                'session_type' => SessionType::InPerson,
                'notes' => 'First pre-marital session. Covered communication styles, love languages, and family of origin discussions. Both partners are open and communicative.',
                'mood_rating' => 8,
                'progress_notes' => 'Strong foundation. Assigned Prepare/Enrich assessment for next session.',
                'next_session_date' => now()->addWeeks(1)->toDateString(),
            ],
        );

        CounselingGoal::firstOrCreate(
            ['counseling_case_id' => $case2->id, 'title' => 'Complete pre-marital curriculum'],
            [
                'description' => 'Work through all six sessions of the pre-marital counseling curriculum covering communication, finances, conflict resolution, intimacy, family, and faith.',
                'target_date' => now()->addMonths(3)->toDateString(),
                'status' => GoalStatus::InProgress,
                'priority' => 1,
                'created_by' => $admin->id,
            ],
        );

        // Closed/resolved grief case (was handled by counselor)
        $case3 = CounselingCase::firstOrCreate(
            ['case_number' => 'CC-2025-008'],
            [
                'person_name' => 'Anonymous Member C',
                'person_contact' => '(555) 000-3333',
                'person_email' => null,
                'case_type' => CaseType::Grief,
                'status' => CaseStatus::ClosedResolved,
                'presenting_issue' => 'Grief counseling following the loss of a spouse.',
                'background_notes' => 'Long-time member, married 42 years. Spouse passed after extended illness.',
                'referral_source' => 'Pastoral care visit',
                'assigned_counselor_id' => $counselor->id,
                'opened_by' => $admin->id,
                'opened_at' => now()->subMonths(4),
                'closed_at' => now()->subWeeks(3),
                'closure_reason' => 'Client has made significant progress in grief processing. Connected with grief support group for ongoing peer support.',
            ],
        );

        CounselingReferral::firstOrCreate(
            ['counseling_case_id' => $case3->id, 'referred_to' => 'GriefShare Support Group'],
            [
                'referral_type' => ReferralType::Internal,
                'referral_date' => now()->subWeeks(4)->toDateString(),
                'reason' => 'Ongoing peer support and community as client transitions from individual counseling.',
                'outcome' => 'Client attended first meeting and reported feeling encouraged by connecting with others who understand.',
                'referred_by' => $counselor->id,
            ],
        );

        CounselingGoal::firstOrCreate(
            ['counseling_case_id' => $case3->id, 'title' => 'Process grief in healthy ways'],
            [
                'description' => 'Develop healthy grief processing habits and build a support network for ongoing journey.',
                'target_date' => now()->subWeeks(3)->toDateString(),
                'status' => GoalStatus::Achieved,
                'priority' => 1,
                'created_by' => $counselor->id,
            ],
        );

        // On-hold family case (assigned to counselor)
        CounselingCase::firstOrCreate(
            ['case_number' => 'CC-2026-003'],
            [
                'person_name' => 'Family D',
                'person_contact' => '(555) 000-4444',
                'person_email' => 'family.d@example.com',
                'case_type' => CaseType::Family,
                'status' => CaseStatus::OnHold,
                'presenting_issue' => 'Family conflict around parenting approaches with blended family dynamics.',
                'background_notes' => 'Blended family of six (2 adults, 4 children from previous marriages). Married 18 months.',
                'referral_source' => 'Referred by small group leader',
                'assigned_counselor_id' => $counselor->id,
                'opened_by' => $admin->id,
                'opened_at' => now()->subWeeks(6),
            ],
        );

        Log::info('DemoSeeder: Seeded counseling cases, sessions, goals, and referrals');
    }
}
