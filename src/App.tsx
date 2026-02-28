import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Plus, Download, Github, Linkedin, Mail, Phone, MapPin, GraduationCap, Briefcase, Award, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI } from "@google/genai";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types & Schemas ---

const resumeSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Invalid phone number"),
  linkedin: z.string().url("Invalid LinkedIn URL").or(z.string().length(0)),
  github: z.string().url("Invalid GitHub URL").or(z.string().length(0)),
  location: z.string().min(2, "Location is required"),
  college: z.string().min(2, "College name is required"),
  degree: z.string().min(2, "Degree is required"),
  year: z.string().min(4, "Graduation year is required"),
  cgpa: z.string().optional(),
  technicalSkills: z.string().min(2, "Technical skills are required"),
  softSkills: z.string().min(2, "Soft skills are required"),
  projects: z.array(z.object({
    title: z.string().min(2, "Project title is required"),
    description: z.string().min(10, "Description is required"),
    technologies: z.string().min(2, "Technologies are required"),
  })).min(1, "At least one project is required"),
  activities: z.array(z.object({
    role: z.string().min(2, "Role is required"),
    achievements: z.string().min(5, "Achievements are required"),
  })).min(1, "At least one activity is required"),
});

type ResumeData = z.infer<typeof resumeSchema> & { linkedinAbout?: string };

// --- Components ---

const Landing = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-950 to-indigo-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-3xl"
      >
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-6 border border-indigo-500/20">
          <Sparkles className="w-4 h-4 mr-2" />
          AI-Powered Resume Builder
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
          Resume Starter for <span className="text-indigo-500">Freshers</span>
        </h1>
        <p className="text-xl text-slate-400 mb-10 leading-relaxed">
          Build your first professional resume in 2 minutes. ATS-friendly, clean design, and AI-generated LinkedIn summary.
        </p>
        <button 
          onClick={() => navigate('/form')}
          className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-indigo-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
        >
          Create Resume
          <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        {[
          { icon: FileText, title: "ATS-Friendly", desc: "Optimized for applicant tracking systems with a clean one-column layout." },
          { icon: Sparkles, title: "AI Summary", desc: "Generate a professional LinkedIn 'About' section tailored to your profile." },
          { icon: Download, title: "Instant PDF", desc: "Download your resume as a high-quality PDF ready for applications." }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
            className="p-6 bg-slate-900/50 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-800"
          >
            <feature.icon className="w-10 h-10 text-indigo-500 mb-4" />
            <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
            <p className="text-slate-400">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ResumeForm = ({ setResumeData }: { setResumeData: (data: ResumeData) => void }) => {
  const navigate = useNavigate();
  const { register, control, handleSubmit, formState: { errors } } = useForm<ResumeData>({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      projects: [{ title: '', description: '', technologies: '' }],
      activities: [{ role: '', achievements: '' }]
    }
  });

  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({ control, name: "projects" });
  const { fields: activityFields, append: appendActivity, remove: removeActivity } = useFieldArray({ control, name: "activities" });

  const onSubmit = (data: ResumeData) => {
    setResumeData(data);
    navigate('/preview');
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/')} className="mb-8 flex items-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>

        <div className="bg-slate-900 shadow-2xl rounded-3xl overflow-hidden border border-slate-800">
          <div className="bg-indigo-600 px-8 py-10 text-white">
            <h2 className="text-3xl font-bold">Resume Details</h2>
            <p className="text-indigo-100 mt-2">Fill in your information to generate your professional resume.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-10">
            {/* Personal Details */}
            <section>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mr-3 text-sm">1</span>
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                  <input {...register('name')} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="John Doe" />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                  <input {...register('email')} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="john@example.com" />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Phone Number</label>
                  <input {...register('phone')} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="+1 234 567 890" />
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Location</label>
                  <input {...register('location')} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="City, Country" />
                  {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">LinkedIn URL</label>
                  <input {...register('linkedin')} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="https://linkedin.com/in/johndoe" />
                  {errors.linkedin && <p className="text-red-400 text-xs mt-1">{errors.linkedin.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">GitHub URL</label>
                  <input {...register('github')} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="https://github.com/johndoe" />
                  {errors.github && <p className="text-red-400 text-xs mt-1">{errors.github.message}</p>}
                </div>
              </div>
            </section>

            {/* Education */}
            <section>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mr-3 text-sm">2</span>
                Education
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">College/University</label>
                  <input {...register('college')} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Stanford University" />
                  {errors.college && <p className="text-red-400 text-xs mt-1">{errors.college.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Degree</label>
                  <input {...register('degree')} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="B.S. in Computer Science" />
                  {errors.degree && <p className="text-red-400 text-xs mt-1">{errors.degree.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Grad Year</label>
                    <input {...register('year')} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="2027" />
                    {errors.year && <p className="text-red-400 text-xs mt-1">{errors.year.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">CGPA/GPA</label>
                    <input {...register('cgpa')} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="3.8/4.0" />
                  </div>
                </div>
              </div>
            </section>

            {/* Skills */}
            <section>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mr-3 text-sm">3</span>
                Skills
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Technical Skills (comma separated)</label>
                  <textarea {...register('technicalSkills')} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24" placeholder="React, Node.js, Python, TypeScript, SQL..." />
                  {errors.technicalSkills && <p className="text-red-400 text-xs mt-1">{errors.technicalSkills.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Soft Skills (comma separated)</label>
                  <textarea {...register('softSkills')} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24" placeholder="Communication, Leadership, Problem Solving..." />
                  {errors.softSkills && <p className="text-red-400 text-xs mt-1">{errors.softSkills.message}</p>}
                </div>
              </div>
            </section>

            {/* Projects */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mr-3 text-sm">4</span>
                  Projects
                </h3>
                <button type="button" onClick={() => appendProject({ title: '', description: '', technologies: '' })} className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center text-sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Project
                </button>
              </div>
              <div className="space-y-8">
                {projectFields.map((field, index) => (
                  <div key={field.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-800/50 relative">
                    {index > 0 && (
                      <button type="button" onClick={() => removeProject(index)} className="absolute top-4 right-4 text-slate-500 hover:text-red-400">
                        Remove
                      </button>
                    )}
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Project Title</label>
                        <input {...register(`projects.${index}.title`)} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="E-commerce App" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Technologies Used</label>
                        <input {...register(`projects.${index}.technologies`)} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="React, Firebase, Stripe" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                        <textarea {...register(`projects.${index}.description`)} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24" placeholder="Developed a full-stack e-commerce platform with user authentication and payment integration..." />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Activities */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mr-3 text-sm">5</span>
                  Extracurricular Activities
                </h3>
                <button type="button" onClick={() => appendActivity({ role: '', achievements: '' })} className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center text-sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Activity
                </button>
              </div>
              <div className="space-y-8">
                {activityFields.map((field, index) => (
                  <div key={field.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-800/50 relative">
                    {index > 0 && (
                      <button type="button" onClick={() => removeActivity(index)} className="absolute top-4 right-4 text-slate-500 hover:text-red-400">
                        Remove
                      </button>
                    )}
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Club / Role</label>
                        <input {...register(`activities.${index}.role`)} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="President, Coding Club" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Achievements / Responsibilities</label>
                        <textarea {...register(`activities.${index}.achievements`)} className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24" placeholder="Organized weekly workshops for 50+ students on web development..." />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="pt-6">
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center">
                Generate Preview
                <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ResumePreview = ({ data }: { data: ResumeData | null }) => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  const calculateResumeScore = (data: ResumeData, summary: string) => {
    let score = 0;
    const feedback: string[] = [];

    // Personal Details (10 points)
    if (data.name && data.email && data.phone) {
      score += 10;
    } else {
      feedback.push("Complete your personal contact information.");
    }

    // Education (15 points)
    if (data.college && data.degree) {
      score += 15;
    } else {
      feedback.push("Add your college and degree details.");
    }

    // Skills (20 points)
    const skillsCount = data.technicalSkills.split(',').filter(s => s.trim().length > 0).length;
    if (skillsCount >= 8) {
      score += 20;
    } else if (skillsCount >= 5) {
      score += 10;
      feedback.push("Try adding at least 8 technical skills for better visibility.");
    } else if (skillsCount >= 3) {
      score += 5;
      feedback.push("Your skills section is a bit thin. Aim for 5-8 key skills.");
    } else {
      feedback.push("Add more technical skills to showcase your expertise.");
    }

    // Projects (25 points)
    if (data.projects.length > 0) {
      score += 10;
      const hasLongDesc = data.projects.some(p => p.description.length > 40);
      if (hasLongDesc) {
        score += 15;
      } else {
        feedback.push("Expand your project descriptions to be more detailed (aim for 40+ characters).");
      }
    } else {
      feedback.push("Add at least one project to demonstrate practical experience.");
    }

    // Activities (10 points)
    if (data.activities.length > 0) {
      score += 10;
    } else {
      feedback.push("Include extracurricular activities or club roles.");
    }

    // LinkedIn About (20 points)
    if (summary && !summary.includes("(Note: Gemini API key is missing")) {
      score += 20;
    } else {
      feedback.push("Generate an AI LinkedIn summary to boost your profile score.");
    }

    return { score, feedback };
  };

  const { score, feedback } = calculateResumeScore(data, aiSummary);

  const getScoreColor = (s: number) => {
    if (s < 50) return "bg-red-500";
    if (s < 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getMotivationalTip = (s: number) => {
    if (s >= 90) return "Outstanding! Your resume is highly competitive.";
    if (s >= 75) return "Great job! A few more tweaks and you'll be at the top.";
    if (s >= 50) return "Good start! Focus on the suggestions to improve your score.";
    return "Keep going! Building a strong resume takes time and effort.";
  };

  useEffect(() => {
    if (data && !aiSummary) {
      generateSummary();
    }
  }, [data]);

  const generateSummary = async () => {
    if (!data) return;
    setLoadingAi(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "undefined") {
        setAiSummary("Passionate student eager to contribute to innovative projects. (Note: Gemini API key is missing or invalid in environment secrets)");
        setLoadingAi(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a professional, engaging LinkedIn "About" section for a first-year college student with the following details:
        Name: ${data.name}
        College: ${data.college}
        Degree: ${data.degree}
        Technical Skills: ${data.technicalSkills}
        Soft Skills: ${data.softSkills}
        Projects: ${JSON.stringify(data.projects)}
        Activities: ${JSON.stringify(data.activities)}
        
        Keep it professional, concise (under 150 words), and ATS-friendly. Focus on potential and enthusiasm.`,
      });

      setAiSummary(response.text || "Passionate student eager to contribute to innovative projects.");
    } catch (error) {
      console.error("Error generating summary:", error);
      setAiSummary("Passionate student eager to contribute to innovative projects.");
    } finally {
      setLoadingAi(false);
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('resume-content');
    if (!element) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data?.name.replace(/\s+/g, '_')}_Resume.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!data) return <div className="p-20 text-center text-slate-400">No data provided. <Link to="/form" className="text-indigo-400">Go back</Link></div>;

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Controls */}
        <div className="md:w-1/3 space-y-6">
          <button onClick={() => navigate('/form')} className="flex items-center text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Edit Details
          </button>

          {/* Resume Score Section */}
          <div className="bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-800">
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-xl font-bold text-white">Resume Score</h3>
              <span className={cn("text-2xl font-black", 
                score < 50 ? "text-red-400" : score < 75 ? "text-yellow-400" : "text-green-400"
              )}>
                {score}/100
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 mb-4 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                className={cn("h-full transition-all duration-1000", getScoreColor(score))}
              />
            </div>

            <p className="text-sm font-medium text-slate-300 mb-4 italic">
              "{getMotivationalTip(score)}"
            </p>

            {feedback.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Improvement Suggestions:</p>
                <ul className="space-y-1">
                  {feedback.map((item, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start">
                      <span className="mr-2 text-indigo-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-800">
            <h3 className="text-xl font-bold mb-4 text-white">Actions</h3>
            <button 
              onClick={downloadPDF}
              disabled={isGenerating}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center mb-4 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              {isGenerating ? "Generating..." : <><Download className="w-5 h-5 mr-2" /> Download PDF</>}
            </button>
            <p className="text-xs text-slate-500 text-center">
              Your resume is optimized for ATS. Download and start applying!
            </p>
          </div>

          <div className="bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/20">
            <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center">
              <Sparkles className="w-5 h-5 mr-2" /> LinkedIn Summary
            </h3>
            {loadingAi ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-indigo-500/20 rounded w-full"></div>
                <div className="h-4 bg-indigo-500/20 rounded w-5/6"></div>
                <div className="h-4 bg-indigo-500/20 rounded w-4/6"></div>
              </div>
            ) : (
              <p className="text-sm text-indigo-200 italic leading-relaxed">
                "{aiSummary}"
              </p>
            )}
            <button onClick={generateSummary} className="mt-4 text-xs font-bold text-indigo-400 hover:underline">
              Regenerate AI Summary
            </button>
          </div>
        </div>

        {/* Resume Content */}
        <div className="md:w-2/3">
          <div id="resume-content" className="bg-white shadow-2xl p-12 min-h-[1123px] w-full resume-container rounded-sm">
            {/* Header */}
            <header className="text-center mb-8">
              <h1 className="text-3xl font-bold uppercase tracking-tight mb-2">{data.name}</h1>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-slate-700">
                <span className="flex items-center"><Mail className="w-3 h-3 mr-1" /> {data.email}</span>
                <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> {data.phone}</span>
                <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {data.location}</span>
                {data.linkedin && <span className="flex items-center"><Linkedin className="w-3 h-3 mr-1" /> LinkedIn</span>}
                {data.github && <span className="flex items-center"><Github className="w-3 h-3 mr-1" /> GitHub</span>}
              </div>
            </header>

            {/* LinkedIn About (Optional in Resume but requested) */}
            <section className="mb-6">
              <h2 className="resume-section-title">Professional Summary</h2>
              <p className="text-sm leading-relaxed">{aiSummary}</p>
            </section>

            {/* Education */}
            <section className="mb-6">
              <h2 className="resume-section-title">Education</h2>
              <div className="flex justify-between items-start mb-1">
                <div className="font-bold text-sm">{data.college}</div>
                <div className="text-sm italic">{data.year}</div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div>{data.degree}</div>
                {data.cgpa && <div>CGPA: {data.cgpa}</div>}
              </div>
            </section>

            {/* Skills */}
            <section className="mb-6">
              <h2 className="resume-section-title">Skills</h2>
              <div className="text-sm mb-2">
                <span className="font-bold">Technical: </span> {data.technicalSkills}
              </div>
              <div className="text-sm">
                <span className="font-bold">Soft Skills: </span> {data.softSkills}
              </div>
            </section>

            {/* Projects */}
            <section className="mb-6">
              <h2 className="resume-section-title">Projects</h2>
              <div className="space-y-4">
                {data.projects.map((project, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-bold text-sm">{project.title}</div>
                      <div className="text-xs italic text-slate-600">{project.technologies}</div>
                    </div>
                    <p className="text-sm leading-relaxed">{project.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Activities */}
            <section>
              <h2 className="resume-section-title">Activities & Achievements</h2>
              <div className="space-y-4">
                {data.activities.map((activity, i) => (
                  <div key={i}>
                    <div className="font-bold text-sm mb-1">{activity.role}</div>
                    <p className="text-sm leading-relaxed">{activity.achievements}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- App Shell ---

export default function App() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);

  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/form" element={<ResumeForm setResumeData={setResumeData} />} />
          <Route path="/preview" element={<ResumePreview data={resumeData} />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}
