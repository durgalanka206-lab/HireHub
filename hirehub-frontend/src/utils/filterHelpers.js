export const DEFAULT_FILTERS = {
  experience: [], // Array of selected: "Fresher", "1–2 Years", "3–5 Years", "5+ Years"
  type: [],       // Array of selected: "Full Time", "Part Time", "Internship", "Contract"
  workMode: [],   // Array of selected: "Remote", "Hybrid", "On-site"
  minSalary: "",
  maxSalary: "",
  location: "",
  company: "",
  skills: "",
  minMatch: 0,
  sortBy: "match" // "match" | "salary" | "recent"
};

export function getJobExperience(job) {
  const titleLower = (job.title || "").toLowerCase();
  const descLower = (job.desc || "").toLowerCase();
  const typeLower = (job.type || "").toLowerCase();
  
  if (typeLower === "internship" || titleLower.includes("intern") || titleLower.includes("fresher")) {
    return 0;
  }
  
  const texts = [...(job.requirements || []), descLower];
  let minYears = null;
  
  for (const text of texts) {
    if (!text) continue;
    const textLower = text.toLowerCase();
    const rangeRegex = /(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years?|yrs?|year?|yr?)\b/g;
    const plusRegex = /(\d+)\+?\s*(?:years?|yrs?|year?|yr?)\b/g;
    
    let match;
    while ((match = rangeRegex.exec(textLower)) !== null) {
      const val = parseInt(match[1]);
      if (minYears === null || val < minYears) {
        minYears = val;
      }
    }
    while ((match = plusRegex.exec(textLower)) !== null) {
      const val = parseInt(match[1]);
      if (minYears === null || val < minYears) {
        minYears = val;
      }
    }
  }
  
  if (minYears === null) {
    if (titleLower.includes("senior") || titleLower.includes("sr.")) {
      return 5;
    }
    if (titleLower.includes("lead") || titleLower.includes("manager") || titleLower.includes("architect")) {
      return 5;
    }
    return 1; // Default fallback
  }
  return minYears;
}

export function getJobWorkMode(job) {
  const locLower = (job.location || "").toLowerCase();
  const descLower = (job.desc || "").toLowerCase();
  
  if (locLower.includes("remote") || descLower.includes("work from home") || descLower.includes("wfh")) {
    return "Remote";
  }
  if (locLower.includes("hybrid") || descLower.includes("hybrid")) {
    return "Hybrid";
  }
  return "On-site";
}

export function getJobSalaryRange(job) {
  if (!job.salary) return { min: 0, max: 0 };
  const matches = job.salary.match(/\d+/g);
  if (matches && matches.length >= 2) {
    let min = parseInt(matches[0]);
    let max = parseInt(matches[1]);
    if (job.salary.includes("$")) {
      min = Math.round(min * 83 / 100);
      max = Math.round(max * 83 / 100);
    }
    return { min, max };
  } else if (matches && matches.length === 1) {
    let val = parseInt(matches[0]);
    if (job.salary.includes("$")) {
      val = Math.round(val * 83 / 100);
    }
    return { min: val, max: val };
  }
  return { min: 0, max: 0 };
}

export function filterAndSortJobs(jobs, filters, calcMatch, showBookmarksOnly, bookmarks, search) {
  if (!Array.isArray(jobs)) return [];
  
  const f = filters || {};
  const activeBookmarks = Array.isArray(bookmarks) ? bookmarks : [];

  return jobs
    .filter(j => {
      if (!j) return false;

      // 1. Search Query
      if (search && typeof search === "string") {
        const query = search.toLowerCase();
        const matchTitle = typeof j.title === "string" && j.title.toLowerCase().includes(query);
        const matchCompany = typeof j.company === "string" && j.company.toLowerCase().includes(query);
        const matchTags = Array.isArray(j.tags) && j.tags.some(t => typeof t === "string" && t.toLowerCase().includes(query));
        if (!matchTitle && !matchCompany && !matchTags) return false;
      }
      
      // 2. Bookmarks Only
      if (showBookmarksOnly) {
        const id = j._id || j.id;
        if (!activeBookmarks.includes(id)) return false;
      }
      
      // 3. Experience
      if (f.experience && Array.isArray(f.experience) && f.experience.length > 0) {
        const exp = getJobExperience(j);
        const matchesExp = f.experience.some(opt => {
          if (opt === "Fresher") return exp < 1;
          if (opt === "1–2 Years") return exp >= 1 && exp <= 2;
          if (opt === "3–5 Years") return exp >= 3 && exp <= 5;
          if (opt === "5+ Years") return exp >= 5;
          return false;
        });
        if (!matchesExp) return false;
      }
      
      // 4. Employment Type
      if (f.type && Array.isArray(f.type) && f.type.length > 0) {
        const jTypeNorm = typeof j.type === "string" ? j.type.toLowerCase().replace(/[^a-z]/g, "") : "";
        const matchesType = f.type.some(opt => {
          if (typeof opt !== "string") return false;
          const optNorm = opt.toLowerCase().replace(/[^a-z]/g, "");
          return jTypeNorm === optNorm;
        });
        if (!matchesType) return false;
      }
      
      // 5. Work Mode
      if (f.workMode && Array.isArray(f.workMode) && f.workMode.length > 0) {
        const jMode = getJobWorkMode(j);
        if (!f.workMode.includes(jMode)) return false;
      }
      
      // 6. Salary Range
      const salary = getJobSalaryRange(j);
      if (f.minSalary && !isNaN(parseFloat(f.minSalary))) {
        const minSal = parseFloat(f.minSalary);
        if (salary.max > 0 && salary.max < minSal) return false;
      }
      if (f.maxSalary && !isNaN(parseFloat(f.maxSalary))) {
        const maxSal = parseFloat(f.maxSalary);
        if (salary.min > 0 && salary.min > maxSal) return false;
      }
      
      // 7. Location
      if (f.location && typeof f.location === "string" && f.location.trim() !== "") {
        const locFilter = f.location.trim().toLowerCase();
        const jLoc = typeof j.location === "string" ? j.location.toLowerCase() : "";
        if (!jLoc.includes(locFilter)) return false;
      }
      
      // 8. Company
      if (f.company && typeof f.company === "string" && f.company.trim() !== "") {
        const compFilter = f.company.trim().toLowerCase();
        const jComp = typeof j.company === "string" ? j.company.toLowerCase() : "";
        if (!jComp.includes(compFilter)) return false;
      }
      
      // 9. Skills
      if (f.skills && typeof f.skills === "string" && f.skills.trim() !== "") {
        const skillsFilter = f.skills
          .split(",")
          .map(s => typeof s === "string" ? s.trim().toLowerCase() : "")
          .filter(Boolean);
        if (skillsFilter.length > 0) {
          const jTags = Array.isArray(j.tags) ? j.tags.map(t => typeof t === "string" ? t.toLowerCase() : "") : [];
          const matchesAllSkills = skillsFilter.every(skill =>
            jTags.some(t => t.includes(skill) || skill.includes(t))
          );
          if (!matchesAllSkills) return false;
        }
      }
      
      // 10. Match Score
      if (f.minMatch && f.minMatch > 0) {
        const score = typeof calcMatch === "function" ? calcMatch(j) : 0;
        if (score < f.minMatch) return false;
      }
      
      return true;
    })
    .map(j => {
      const matchScore = typeof calcMatch === "function" ? calcMatch(j) : 0;
      return { ...j, match: matchScore };
    })
    .sort((a, b) => {
      if (f.sortBy === "salary") {
        const salA = getJobSalaryRange(a).max;
        const salB = getJobSalaryRange(b).max;
        return salB - salA;
      }
      if (f.sortBy === "recent") {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
      }
      return (b.match || 0) - (a.match || 0);
    });
}
