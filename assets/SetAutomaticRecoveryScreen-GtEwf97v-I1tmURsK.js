import{dG as k,de as I,d8 as P,da as u,dc as e,ep as v,eF as j,dC as W,dd as A}from"./index-U3kFXnf4.js";import{F as M}from"./ExclamationTriangleIcon-DJjDxqCv.js";import{F as V}from"./LockClosedIcon-BHkB9NAV.js";import{L as S,u as b,h as C}from"./ModalFooter-BldNwiHO-Du0qgpJM.js";import{r as B}from"./Subtitle-CV-2yKE4-BrQt8J2w.js";import{e as F}from"./Title-BnzYV3Is-DbOTFv53.js";const H=A.div`
  && {
    border-width: 4px;
  }

  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  aspect-ratio: 1;
  border-style: solid;
  border-color: ${l=>l.$color??"var(--privy-color-accent)"};
  border-radius: 50%;
`,q={component:()=>{var g;let{user:l}=k(),{client:T,walletProxy:m,refreshSessionAndUser:E,closePrivyModal:i}=I(),s=P(),{entropyId:f,entropyIdVerifier:R}=((g=s.data)==null?void 0:g.recoverWallet)??{},[n,h]=u.useState(!1),[c,U]=u.useState(null),[d,p]=u.useState(null);function y(){var r,o,t,a;if(!n){if(d)return(o=(r=s.data)==null?void 0:r.setWalletPassword)==null||o.onFailure(d),void i();if(!c)return(a=(t=s.data)==null?void 0:t.setWalletPassword)==null||a.onFailure(Error("User exited set recovery flow")),void i()}}s.onUserCloseViaDialogOrKeybindRef.current=y;let $=!(!n&&!c);return e.jsxs(e.Fragment,d?{children:[e.jsx(S,{onClose:y},"header"),e.jsx(H,{$color:"var(--privy-color-error)",style:{alignSelf:"center"},children:e.jsx(M,{height:38,width:38,stroke:"var(--privy-color-error)"})}),e.jsx(F,{style:{marginTop:"0.5rem"},children:"Something went wrong"}),e.jsx(v,{style:{minHeight:"2rem"}}),e.jsx(b,{onClick:()=>p(null),children:"Try again"}),e.jsx(C,{})]}:{children:[e.jsx(S,{onClose:y},"header"),e.jsx(V,{style:{width:"3rem",height:"3rem",alignSelf:"center"}}),e.jsx(F,{style:{marginTop:"0.5rem"},children:"Automatically secure your account"}),e.jsx(B,{style:{marginTop:"1rem"},children:"When you log into a new device, you’ll only need to authenticate to access your account. Never get logged out if you forget your password."}),e.jsx(v,{style:{minHeight:"2rem"}}),e.jsx(b,{loading:n,disabled:$,onClick:()=>async function(){h(!0);try{let r=await T.getAccessToken(),o=j(l,f);if(!r||!m||!o)return;if(!(await m.setRecovery({accessToken:r,entropyId:f,entropyIdVerifier:R,existingRecoveryMethod:o.recoveryMethod,recoveryMethod:"privy"})).entropyId)throw Error("Unable to set recovery on wallet");let t=await E();if(!t)throw Error("Unable to set recovery on wallet");let a=j(t,o.address);if(!a)throw Error("Unabled to set recovery on wallet");U(!!t),setTimeout(()=>{var w,x;(x=(w=s.data)==null?void 0:w.setWalletPassword)==null||x.onSuccess(a),i()},W)}catch(r){p(r)}finally{h(!1)}}(),children:c?"Success":"Confirm"}),e.jsx(C,{})]})}};export{q as SetAutomaticRecoveryScreen,q as default};
