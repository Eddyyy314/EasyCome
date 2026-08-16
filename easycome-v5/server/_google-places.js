const fieldMask='places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.primaryType,places.primaryTypeDisplayName,places.types,places.businessStatus,nextPageToken';
function apiKey(){const key=String(process.env.GOOGLE_PLACES_API_KEY||'').trim();if(!key)throw new Error('GOOGLE_PLACES_API_KEY mancante su Vercel.');return key}
export async function textSearch(textQuery,pageSize=10,pageToken=''){
  const body={textQuery,pageSize:Math.max(1,Math.min(20,Number(pageSize)||10)),languageCode:'it',regionCode:'IT'};if(pageToken)body.pageToken=pageToken;
  const r=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'content-type':'application/json','X-Goog-Api-Key':apiKey(),'X-Goog-FieldMask':fieldMask},body:JSON.stringify(body)});
  if(!r.ok)throw new Error(`Google Places ${r.status}: ${await r.text()}`);return r.json();
}
export async function placeDetails(placeId){
  if(!placeId)throw new Error('Place ID mancante.');
  const mask='id,displayName,formattedAddress,websiteUri,nationalPhoneNumber,primaryType,primaryTypeDisplayName,types,businessStatus';
  const r=await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=it&regionCode=IT`,{headers:{'X-Goog-Api-Key':apiKey(),'X-Goog-FieldMask':mask}});
  if(!r.ok)throw new Error(`Google Place Details ${r.status}: ${await r.text()}`);return r.json();
}
