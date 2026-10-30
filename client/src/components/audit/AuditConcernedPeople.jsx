import { UsersRound } from 'lucide-react';

export default function AuditConcernedPeople({ audit }) {
  const people = audit.concernedPersons || [];
  return <div className="ca-concerned-people"><span className="ca-small"><UsersRound size={13} />Concerned people</span>{people.length ? <ul>{people.map((person, index) => <li key={person?._id || index}>{person?.employeeName || person?.employeeId || 'User no longer available'}</li>)}</ul> : <span className="ca-small">Not selected</span>}</div>;
}
