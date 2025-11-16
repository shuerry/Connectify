import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmail } from '../../../services/userService';
import './verifyEmail.css';

type State = 'loading' | 'ok' | 'err';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<State>('loading');
  const [message, setMessage] = useState<string>('Verifying…');
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return; // ← prevent double-run in dev
    ranRef.current = true;

    const token = params.get('token');
    if (!token) {
      setState('err');
      setMessage('Missing verification token.');
      return;
    }

    (async () => {
      try {
        const r = await verifyEmail(token);
        setState('ok');
        setMessage(r?.msg || 'Email verified successfully.');
      } catch (e: unknown) {
        const error = e as Error & { response?: { data?: { error?: string } } };
        const apiErr = error?.response?.data?.error || error?.message || 'Verification failed.';
        setState('err');
        setMessage(apiErr);
      }
    })();
  }, [params]);

  return (
    <div className='verify-container'>
      <div className='verify-card'>
        <h1 className='verify-title'>Verify your email</h1>

        {state === 'loading' && <p className='verify-text-muted'>Verifying… please wait.</p>}

        {state === 'ok' && (
          <div className='verify-section'>
            <p className='verify-success'>{message}</p>

            <div className='verify-actions'>
              <button className='verify-button' onClick={() => navigate('/')}>
                Go to Login
              </button>

              <Link to='/' className='verify-link'>
                Return to login page
              </Link>
            </div>
          </div>
        )}

        {state === 'err' && (
          <div className='verify-section'>
            <p className='verify-error'>{message}</p>

            <div className='verify-actions'>
              <button className='verify-button-secondary' onClick={() => navigate('/')}>
                Go to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
