import { useEffect, useState } from 'react';
import { listRecords } from './userData';

export default function usePublicRecords(kind) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    listRecords(kind).then(rows => { if (active) setRecords(rows); })
      .catch(error => { if (active) setError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kind]);
  return { records, loading, error };
}
