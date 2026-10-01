import{dG as M,de as k,d8 as N,da as r,fu as z,dL as C,eQ as E,eR as T,dc as a,dC as I,dd as p,ck as O,ch as q,fv as P}from"./index-U3kFXnf4.js";import{h as F}from"./CopyToClipboard-i_OQSBJr-BZxFqKU5.js";import{d as V}from"./Layouts-BMRfo5hw-C_pNYYRL.js";import{a as $,i as B}from"./JsonTree-BHzNC-ic-BFJLvgTI.js";import{n as H}from"./ScreenLayout-XFsWudNK-C8hPGrh_.js";import{c as J}from"./createLucideIcon-Dfw5lCfR.js";import"./ModalFooter-BldNwiHO-Du0qgpJM.js";import"./Screen-Dtn4lspb-DVwl0Ckc.js";import"./index-CWARkn2w-DSjCgH3N.js";/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]],G=J("square-pen",Q),K=p.img`
  && {
    height: ${e=>e.size==="sm"?"65px":"140px"};
    width: ${e=>e.size==="sm"?"65px":"140px"};
    border-radius: 16px;
    margin-bottom: 12px;
  }
`;let U=e=>{if(!O(e))return e;try{let s=q(e);return s.includes("�")?e:s}catch{return e}},W=e=>{try{let s=P.decode(e),i=new TextDecoder().decode(s);return i.includes("�")?e:i}catch{return e}},X=e=>{let{types:s,primaryType:i,...l}=e.typedData;return a.jsxs(a.Fragment,{children:[a.jsx(te,{data:l}),a.jsx(F,{text:(o=e.typedData,JSON.stringify(o,null,2)),itemName:"full payload to clipboard"})," "]});var o};const Y=({method:e,messageData:s,copy:i,iconUrl:l,isLoading:o,success:g,walletProxyIsLoading:m,errorMessage:x,isCancellable:d,onSign:c,onCancel:y,onClose:u})=>a.jsx(H,{title:i.title,subtitle:i.description,showClose:!0,onClose:u,icon:G,iconVariant:"subtle",helpText:x?a.jsx(ee,{children:x}):void 0,primaryCta:{label:i.buttonText,onClick:c,disabled:o||g||m,loading:o},secondaryCta:d?{label:"Not now",onClick:y,disabled:o||g||m}:void 0,watermark:!0,children:a.jsxs(V,{children:[l?a.jsx(K,{style:{alignSelf:"center"},size:"sm",src:l,alt:"app image"}):null,a.jsxs(Z,{children:[e==="personal_sign"&&a.jsx(w,{children:U(s)}),e==="eth_signTypedData_v4"&&a.jsx(X,{typedData:s}),e==="solana_signMessage"&&a.jsx(w,{children:W(s)})]})]})}),ue={component:()=>{let{authenticated:e}=M(),{initializeWalletProxy:s,closePrivyModal:i}=k(),{navigate:l,data:o,onUserCloseViaDialogOrKeybindRef:g}=N(),[m,x]=r.useState(!0),[d,c]=r.useState(""),[y,u]=r.useState(),[f,b]=r.useState(null),[R,S]=r.useState(!1);r.useEffect(()=>{e||l("LandingScreen")},[e]),r.useEffect(()=>{s(z).then(n=>{x(!1),n||(c("An error has occurred, please try again."),u(new C(new E(d,T.E32603_DEFAULT_INTERNAL_ERROR.eipCode))))})},[]);let{method:v,data:_,confirmAndSign:j,onSuccess:D,onFailure:L,uiOptions:t}=o.signMessage,A={title:(t==null?void 0:t.title)||"Sign message",description:(t==null?void 0:t.description)||"Signing this message will not cost you any fees.",buttonText:(t==null?void 0:t.buttonText)||"Sign and continue"},h=n=>{n?D(n):L(y||new C(new E("The user rejected the request.",T.E4001_USER_REJECTED_REQUEST.eipCode))),i({shouldCallAuthOnSuccess:!1}),setTimeout(()=>{b(null),c(""),u(void 0)},200)};return g.current=()=>{h(f)},a.jsx(Y,{method:v,messageData:_,copy:A,iconUrl:t!=null&&t.iconUrl&&typeof t.iconUrl=="string"?t.iconUrl:void 0,isLoading:R,success:f!==null,walletProxyIsLoading:m,errorMessage:d,isCancellable:t==null?void 0:t.isCancellable,onSign:async()=>{S(!0),c("");try{let n=await j();b(n),S(!1),setTimeout(()=>{h(n)},I)}catch(n){console.error(n),c("An error has occurred, please try again."),u(new C(new E(d,T.E32603_DEFAULT_INTERNAL_ERROR.eipCode))),S(!1)}},onCancel:()=>h(null),onClose:()=>h(f)})}};let Z=p.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
`,ee=p.p`
  && {
    margin: 0;
    width: 100%;
    text-align: center;
    color: var(--privy-color-error-dark);
    font-size: 14px;
    line-height: 22px;
  }
`,te=p($)`
  margin-top: 0;
`,w=p(B)`
  margin-top: 0;
`;export{ue as SignRequestScreen,Y as SignRequestView,ue as default};
