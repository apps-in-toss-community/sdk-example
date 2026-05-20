import { appLogin } from '@apps-in-toss/web-framework';
import { OAuthProvider, getAuth, signInWithCredential } from 'firebase/auth';

// Firebase uses the same bridge-issued OIDC id_token as Supabase — no separate
// endpoint. Register the bridge as an OIDC provider in Firebase (Identity
// Platform), then sign in with the id_token your backend returns.
//
// Spark-plan note: the public bridge issues only a standard id_token. A
// Firebase *Custom Token* (for environments that block outbound calls) requires
// self-hosting the bridge with a Firebase service account — the community
// instance deliberately does not custody end-user service accounts.

// Step 1 + 2: same as the Supabase path — get the code, exchange it via your
// backend (`supabase/functions/toss-login` or your own), receive an id_token.
const { authorizationCode } = await appLogin();
const res = await fetch('/functions/v1/toss-login', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ authorizationCode, referrer: 'DEFAULT' }),
});
const { id_token } = await res.json();

// Step 3: sign in to Firebase via the OIDC provider you configured.
const provider = new OAuthProvider('oidc.toss-bridge');
const credential = provider.credential({ idToken: id_token });
const userCredential = await signInWithCredential(getAuth(), credential);
