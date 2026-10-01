import{d8 as F,d9 as T,de as I,da as d,dC as w,dc as a,dE as y,eq as q,dz as B,dd as n}from"./index-U3kFXnf4.js";import{h as O}from"./CopyToClipboard-i_OQSBJr-BZxFqKU5.js";import{n as _}from"./OpenLink-CUpJ1mOr--nrlr3sL.js";import{x as E}from"./QrCode-cA9rnMIN-C9b8Y6gp.js";import{n as A}from"./ScreenLayout-XFsWudNK-C8hPGrh_.js";import{l as h}from"./farcaster-DPlSjvF5-CB_VECXg.js";import"./dijkstra-D_NXgYpA.js";import"./ModalFooter-BldNwiHO-Du0qgpJM.js";import"./Screen-Dtn4lspb-DVwl0Ckc.js";import"./index-CWARkn2w-DSjCgH3N.js";let S="#8a63d2";const M=({appName:u,loading:m,success:i,errorMessage:e,connectUri:r,onBack:s,onClose:c,onOpenFarcaster:o})=>a.jsx(A,y||m?q?{title:e?e.message:"Add a signer to Farcaster",subtitle:e?e.detail:`This will allow ${u} to add casts, likes, follows, and more on your behalf.`,icon:h,iconVariant:"loading",iconLoadingStatus:{success:i,fail:!!e},primaryCta:r&&o?{label:"Open Farcaster app",onClick:o}:void 0,onBack:s,onClose:c,watermark:!0}:{title:e?e.message:"Requesting signer from Farcaster",subtitle:e?e.detail:"This should only take a moment",icon:h,iconVariant:"loading",iconLoadingStatus:{success:i,fail:!!e},onBack:s,onClose:c,watermark:!0,children:r&&y&&a.jsx(R,{children:a.jsx(_,{text:"Take me to Farcaster",url:r,color:S})})}:{title:"Add a signer to Farcaster",subtitle:`This will allow ${u} to add casts, likes, follows, and more on your behalf.`,onBack:s,onClose:c,watermark:!0,children:a.jsxs(z,{children:[a.jsx(L,{children:r?a.jsx(E,{url:r,size:275,squareLogoElement:h}):a.jsx(V,{children:a.jsx(B,{})})}),a.jsxs(N,{children:[a.jsx(P,{children:"Or copy this link and paste it into a phone browser to open the Farcaster app."}),r&&a.jsx(O,{text:r,itemName:"link",color:S})]})]})});let R=n.div`
  margin-top: 24px;
`,z=n.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`,L=n.div`
  padding: 24px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 275px;
`,N=n.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`,P=n.div`
  font-size: 0.875rem;
  text-align: center;
  color: var(--privy-color-foreground-2);
`,V=n.div`
  position: relative;
  width: 82px;
  height: 82px;
`;const Z={component:()=>{let{lastScreen:u,navigateBack:m,data:i}=F(),e=T(),{requestFarcasterSignerStatus:r,closePrivyModal:s}=I(),[c,o]=d.useState(void 0),[k,v]=d.useState(!1),[j,x]=d.useState(!1),g=d.useRef([]),t=i==null?void 0:i.farcasterSigner;d.useEffect(()=>{let b=Date.now(),l=setInterval(async()=>{if(!(t!=null&&t.public_key))return clearInterval(l),void o({retryable:!0,message:"Connect failed",detail:"Something went wrong. Please try again."});t.status==="approved"&&(clearInterval(l),v(!1),x(!0),g.current.push(setTimeout(()=>s({shouldCallAuthOnSuccess:!1,isSuccess:!0}),w)));let p=await r(t==null?void 0:t.public_key),C=Date.now()-b;p.status==="approved"?(clearInterval(l),v(!1),x(!0),g.current.push(setTimeout(()=>s({shouldCallAuthOnSuccess:!1,isSuccess:!0}),w))):C>3e5?(clearInterval(l),o({retryable:!0,message:"Connect failed",detail:"The request timed out. Try again."})):p.status==="revoked"&&(clearInterval(l),o({retryable:!0,message:"Request rejected",detail:"The request was rejected. Please try again."}))},2e3);return()=>{clearInterval(l),g.current.forEach(p=>clearTimeout(p))}},[]);let f=(t==null?void 0:t.status)==="pending_approval"?t.signer_approval_url:void 0;return a.jsx(M,{appName:e.name,loading:k,success:j,errorMessage:c,connectUri:f,onBack:u?m:void 0,onClose:s,onOpenFarcaster:()=>{f&&(window.location.href=f)}})}};export{Z as FarcasterSignerStatusScreen,M as FarcasterSignerStatusView,Z as default};
