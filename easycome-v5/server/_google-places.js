// Google Places (New) adapter.
// Keep Text Search lean: the public website is requested only for selected prospects,
// because it is needed to discover a public business email.
const searchFieldMask = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.types',
  'places.businessStatus',
  'nextPageToken'
].join(',');

function apiKey(){
  const key=String(process.env.GOOGLE_PLACES_API_KEY||'').trim();
  if(!key) throw new Error('GOOGLE_PLACES_API_KEY mancante su Vercel.');
  return key;
}

async function googleJson(response,label){
  const text=await response.text();
  let payload=null;
  try{ payload=text ? JSON.parse(text) : {}; }catch{ payload={raw:text}; }
  if(!response.ok){
    const msg=payload?.error?.message || payload?.error?.status || payload?.raw || 'Errore sconosciuto';
    throw new Error(`${label} ${response.status}: ${msg}`);
  }
  return payload||{};
}

export async function textSearch(textQuery,pageSize=10,pageToken=''){
  const body={
    textQuery,
    pageSize:Math.max(1,Math.min(20,Number(pageSize)||10)),
    languageCode:'it',
    regionCode:'IT'
  };
  if(pageToken) body.pageToken=pageToken;
  const r=await fetch('https://places.googleapis.com/v1/places:searchText',{
    method:'POST',
    headers:{
      'content-type':'application/json',
      'X-Goog-Api-Key':apiKey(),
      'X-Goog-FieldMask':searchFieldMask
    },
    body:JSON.stringify(body)
  });
  return googleJson(r,'Google Places');
}

export async function placeDetails(placeId){
  if(!placeId) throw new Error('Place ID mancante.');
  const mask='id,displayName,formattedAddress,websiteUri,primaryType,primaryTypeDisplayName,types,businessStatus';
  const r=await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=it&regionCode=IT`,{
    headers:{'X-Goog-Api-Key':apiKey(),'X-Goog-FieldMask':mask}
  });
  return googleJson(r,'Google Place Details');
}
