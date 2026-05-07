export type CourseCategory = 'Class 1-10' | 'Class 11-12' | 'AI & Digital';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  price: number;
  originalPrice: number;
  thumbnail: string;
  features: string[];
}

export const MOCK_COURSES: Course[] = [
  {
    id: 'wbbse-class10',
    title: 'Madhyamik Target Batch 2026',
    description: 'Complete preparation for WB Board Class 10 with Live classes, Notes, and Mock Tests.',
    category: 'Class 1-10',
    price: 499,
    originalPrice: 999,
    thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600',
    features: ['All Subjects', 'Live + Recorded', 'PDF Notes', '24/7 Doubt Forum']
  },
  {
    id: 'wbbse-class8',
    title: 'Foundation Batch Class 8',
    description: 'Build a strong foundation for higher classes with engaging video lessons.',
    category: 'Class 1-10',
    price: 299,
    originalPrice: 599,
    thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600',
    features: ['Engaging Animations', 'Maths & Science Focus', 'Weekly Assignments']
  },
  {
    id: 'wbchse-phy-12',
    title: 'Physics Prodigy Class 12',
    description: 'Master Physics for WBCHSE Boards and competitive exams.',
    category: 'Class 11-12',
    price: 799,
    originalPrice: 1499,
    thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&q=80&w=600',
    features: ['In-depth Concepts', 'Numerical solving', 'Board-oriented PDF Notes']
  },
  {
    id: 'wbchse-bio-11',
    title: 'Biology Masterclass Class 11',
    description: 'Comprehensive Biology course for WBCHSE. Concepts made crystal clear.',
    category: 'Class 11-12',
    price: 699,
    originalPrice: 1199,
    thumbnail: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=600',
    features: ['Diagrammatic Study', 'Live Doubt Sessions', 'NEET foundation']
  },
  {
    id: 'wbchse-geo-11-12',
    title: 'Geography Special 11 & 12',
    description: 'Map pointing, physical and human geography covered entirely.',
    category: 'Class 11-12',
    price: 599,
    originalPrice: 999,
    thumbnail: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600',
    features: ['Map Worksheets', 'Previous Year Q&A', 'Recorded Lectures']
  },
  {
    id: 'ai-web-dev',
    title: 'Web Dev & AI Integration',
    description: 'Learn modern Web Development and how to integrate AI tools into projects.',
    category: 'AI & Digital',
    price: 1999,
    originalPrice: 4999,
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600',
    features: ['HTML/CSS/JS/React', 'Prompt Engineering', 'Build real projects', 'Certificate']
  },
  {
    id: 'ai-basics',
    title: 'AI Basics Mastercamp',
    description: 'Understand the world of Artificial Intelligence from scratch. No coding required.',
    category: 'AI & Digital',
    price: 999,
    originalPrice: 2499,
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600',
    features: ['ChatGPT Mastery', 'AI for Students', 'Future Skills']
  }
];
