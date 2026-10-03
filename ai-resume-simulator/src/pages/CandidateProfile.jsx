import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowLeft,
  Save,
  Upload,
  UserRound,
} from "lucide-react";

import {
  getCandidateProfile,
  updateCandidateProfile,
} from "../Services/candidateService";

import MatchScoreRing from "../components/MatchScoreRing";

function CandidateProfile() {
  const [profile, setProfile] = useState(null);
  const [skillsInput, setSkillsInput] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getCandidateProfile();

        setProfile({ ...data });
        setSkillsInput(data.skills.join(", "));
      } catch (err) {
        setError("Unable to load candidate profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
  }

  function handleResumeChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedExtensions = /\.(pdf|doc|docx)$/i;

    if (!allowedExtensions.test(file.name)) {
      setError("Please select a PDF, DOC, or DOCX file.");
      event.target.value = "";
      return;
    }

    setError("");
    setResumeFile(file);
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updatedProfile = {
        ...profile,

        skills: skillsInput
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),

        resumeName: resumeFile
          ? resumeFile.name
          : profile.resumeName,
      };

      const savedProfile =
        await updateCandidateProfile(updatedProfile);

      setProfile({ ...savedProfile });
      setSkillsInput(savedProfile.skills.join(", "));
      setResumeFile(null);

      setMessage(
        "Profile updated in this demo. Changes are not yet saved to a backend."
      );
    } catch (err) {
      setError("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-secondary-500">
        Loading candidate profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-red-600">
        {error || "Candidate profile not found."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">

        {/* Back Button */}
        <Link
          to="/candidate-dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-700">
            Candidate Profile
          </h1>

          <p className="mt-2 text-secondary-500">
            Manage your personal information, skills, and resume.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Profile Form */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-primary-50 p-3 text-primary-600">
                <UserRound size={24} />
              </div>

              <h2 className="text-xl font-bold text-secondary-700">
                Personal Information
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name */}
              <div>
                <label
                  htmlFor="candidate-name"
                  className="mb-2 block text-sm font-semibold text-secondary-600"
                >
                  Full Name
                </label>

                <input
                  id="candidate-name"
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary-600"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="candidate-email"
                  className="mb-2 block text-sm font-semibold text-secondary-600"
                >
                  Email Address
                </label>

                <input
                  id="candidate-email"
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary-600"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="candidate-phone"
                  className="mb-2 block text-sm font-semibold text-secondary-600"
                >
                  Phone Number
                </label>

                <input
                  id="candidate-phone"
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary-600"
                />
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="candidate-location"
                  className="mb-2 block text-sm font-semibold text-secondary-600"
                >
                  Location
                </label>

                <input
                  id="candidate-location"
                  type="text"
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary-600"
                />
              </div>

              {/* Skills */}
              <div>
                <label
                  htmlFor="candidate-skills"
                  className="mb-2 block text-sm font-semibold text-secondary-600"
                >
                  Skills
                </label>

                <textarea
                  id="candidate-skills"
                  value={skillsInput}
                  onChange={(event) => {
                    setSkillsInput(event.target.value);
                    setMessage("");
                  }}
                  rows={3}
                  placeholder="React, Python, JavaScript, SQL"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary-600"
                />

                <p className="mt-1 text-xs text-secondary-500">
                  Separate each skill using a comma.
                </p>
              </div>


              {/* Feedback */}
              {message && (
                <p role="status" className="text-sm text-green-600">
                  {message}
                </p>
              )}

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              {/* Save */}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Match Score */}
          <div className="self-start rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-center text-lg font-bold text-secondary-700">
              Candidate Match
            </h2>

            <MatchScoreRing
              score={profile.overallMatchScore}
            />

            <p className="mt-5 text-center text-sm leading-6 text-secondary-500">
              This score represents the candidate's overall
              matching result.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateProfile;