// Convenience barrel for repository-level utilities that aren't tied to one
// entity. Domain repositories (events/polls/questions/options/responses/
// stats) are imported directly by name from their own files — see
// docs/ARCHITECTURE.md.
export { resetAllData } from './_localStorage'
