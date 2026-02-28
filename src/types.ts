export interface Project {
  title: string;
  description: string;
  technologies: string;
}

export interface Activity {
  role: string;
  achievements: string;
}

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  location: string;
  college: string;
  degree: string;
  year: string;
  cgpa: string;
  technicalSkills: string;
  softSkills: string;
  projects: Project[];
  activities: Activity[];
  linkedinAbout?: string;
}
