/* Privacy guard: runs before anything leaves the browser.
   Part of the IEP Goal Builder. Plain script (not a module): loaded in order by
   index.html, sharing top-level names with the other files. */

const VSN  = /\b\d{9}\b/;
const DOB  = /\b\d{1,2}[\/\-.]\d{1,2}[\/\-.](19|20)\d{2}\b/;
const SCHOOL = /\b[A-Z][A-Za-z'\-]+(?:\s+[A-Z][A-Za-z'\-]+){0,3}\s+(?:Primary School|Secondary College|Secondary School|College|Grammar|High School|Specialist School)\b/;
function guard(t){
  if (VSN.test(t))    return 'That looks like a student number. Strip it and use a pseudonym — this tool is not a DET-approved system for student personal information.';
  if (DOB.test(t))    return 'That looks like a date of birth. Remove it — a DOB is an identifying detail and this tool is not a DET-approved system for student personal information.';
  if (SCHOOL.test(t)) return 'That names a school. Remove it — this tool is not a DET-approved system for student personal information.';
  return null;
}
