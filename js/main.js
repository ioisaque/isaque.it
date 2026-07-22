const CDN = 'https://cdn.isaque.it/assets';

export async function loadData() {
  const [erasRes, projectsRes] = await Promise.all([
    fetch('./data/eras.json'),
    fetch('./data/projects.json'),
  ]);
  const eras = await erasRes.json();
  const projects = await projectsRes.json();
  return { eras, projects };
}

export function getProjectBySlug(projects, slug) {
  return projects.find((p) => p.slug === slug);
}

export function getProjectsForEra(projects, eraId) {
  return projects.filter((p) => p.era === eraId);
}

export function getFeaturedProjects(projects) {
  return projects.filter((p) => p.featured);
}

export { CDN };
