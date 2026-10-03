import { useEffect, useMemo, useState } from "react";

import {
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import JobCard from "../components/JobCard";
import { getJobs } from "../Services/jobsService";

function JobMatching() {

  const [jobs, setJobs] = useState([]);

  const [search, setSearch] = useState("");

  const [role, setRole] = useState("All roles");

  const [location, setLocation] =
    useState("All locations");

  const [skill, setSkill] =
    useState("All skills");

  const [loading, setLoading] =
    useState(true);


  /*
    LOAD JOBS
  */

  useEffect(() => {

    let cancelled = false;

    async function loadJobs() {

      setLoading(true);

      try {

        const result = await getJobs();

        if (!cancelled) {

          setJobs(
            Array.isArray(result)
              ? result
              : []
          );

        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    }

    loadJobs();

    return () => {
      cancelled = true;
    };

  }, []);


  /*
    CREATE FILTER OPTIONS
  */

  const roles = useMemo(
    () => [
      "All roles",
      ...new Set(
        jobs.map((job) => job.title)
      ),
    ],
    [jobs]
  );


  const locations = useMemo(
    () => [
      "All locations",
      ...new Set(
        jobs.map((job) => job.location)
      ),
    ],
    [jobs]
  );


  const skills = useMemo(
    () => [
      "All skills",
      ...new Set(
        jobs.flatMap(
          (job) => job.skills
        )
      ),
    ],
    [jobs]
  );


  /*
    FILTER JOBS
  */

  const filteredJobs = useMemo(() => {

    const query =
      search.trim().toLowerCase();

    return jobs.filter((job) => {

      const searchableText = [
        job.title,
        job.company,
        job.location,
        ...job.skills,
      ]
        .join(" ")
        .toLowerCase();


      const matchesSearch =
        !query ||
        searchableText.includes(query);


      const matchesRole =
        role === "All roles" ||
        job.title === role;


      const matchesLocation =
        location === "All locations" ||
        job.location === location;


      const matchesSkill =
        skill === "All skills" ||
        job.skills.includes(skill);


      return (
        matchesSearch &&
        matchesRole &&
        matchesLocation &&
        matchesSkill
      );

    });

  }, [
    jobs,
    search,
    role,
    location,
    skill,
  ]);


  /*
    CLEAR FILTERS
  */

  const hasFilters =
    search ||
    role !== "All roles" ||
    location !== "All locations" ||
    skill !== "All skills";


  const clearFilters = () => {

    setSearch("");

    setRole("All roles");

    setLocation("All locations");

    setSkill("All skills");

  };


  /*
    UI
  */

  return (

    <div className="min-h-screen bg-secondary-100 px-4 py-8 sm:px-6">

      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div>

          <p className="text-sm font-semibold text-primary-600">
            Job Matching
          </p>

          <h1 className="mt-1 text-3xl font-bold text-secondary-700">
            Find roles that match your profile
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary-500">
            Search jobs and filter by role, location,
            or skill. Match percentages are provided
            by the AI matching service.
          </p>

        </div>


        {/* SEARCH + FILTERS */}

        <div className="mt-7 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">

          {/* SEARCH */}

          <div className="relative">

            <Search
              size={19}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by job title, company, location, or skill..."
              className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />

          </div>


          {/* FILTERS */}

          <div className="mt-4 grid gap-3 md:grid-cols-3">

            {/* ROLE */}

            <label className="text-sm">

              <span className="mb-1.5 block font-medium text-secondary-700">
                Role
              </span>

              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value)
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-primary-500"
              >

                {roles.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}

              </select>

            </label>


            {/* LOCATION */}

            <label className="text-sm">

              <span className="mb-1.5 block font-medium text-secondary-700">
                Location
              </span>

              <select
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-primary-500"
              >

                {locations.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}

              </select>

            </label>


            {/* SKILL */}

            <label className="text-sm">

              <span className="mb-1.5 block font-medium text-secondary-700">
                Skill
              </span>

              <select
                value={skill}
                onChange={(event) =>
                  setSkill(event.target.value)
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-primary-500"
              >

                {skills.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}

              </select>

            </label>

          </div>


          {/* RESULT COUNT */}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">

            <div className="inline-flex items-center gap-2 text-sm text-secondary-500">

              <SlidersHorizontal size={16} />

              {filteredJobs.length}

              {" "}

              {filteredJobs.length === 1
                ? "job"
                : "jobs"}

              {" "}found

            </div>


            {hasFilters && (

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-600"
              >

                <X size={15} />

                Clear filters

              </button>

            )}

          </div>

        </div>


        {/* JOB LIST */}

        {loading ? (

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            {Array.from({ length: 4 }).map(
              (_, index) => (

                <div
                  key={index}
                  className="h-64 animate-pulse rounded-xl bg-white shadow-sm"
                />

              )
            )}

          </div>

        ) : filteredJobs.length > 0 ? (

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            {filteredJobs.map((job) => (

              <JobCard
                key={job.id}
                job={job}
              />

            ))}

          </div>

        ) : (

          /* EMPTY STATE */

          <div className="mt-6 rounded-xl bg-white px-6 py-16 text-center shadow-sm">

            <h2 className="text-xl font-bold text-secondary-700">
              No matching jobs
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-secondary-500">
              Try changing your search or one
              of the filters to see more
              opportunities.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Reset filters
            </button>

          </div>

        )}

      </div>

    </div>

  );

}

export default JobMatching;