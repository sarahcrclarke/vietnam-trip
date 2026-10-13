# Vietnam Trip — image migration plan

This is a plan, not a script. Nothing here has been uploaded or executed. It is a separate, later step from the data seed (`seed-vietnam-trip.sql`), which leaves every image column `null`.

## Storage layout

Upload under the `trip-photos` bucket with path prefix `cb2a7994-4560-4118-9bb2-100d371785cf/...` (required by schema.sql storage policies, which check the first path segment via `is_trip_member`).

- Hero: `cb2a7994-4560-4118-9bb2-100d371785cf/hero.jpg`
- Stop photo: `cb2a7994-4560-4118-9bb2-100d371785cf/stops/<stop_id>/photo.jpg`
- Activity image: `cb2a7994-4560-4118-9bb2-100d371785cf/activities/<activity_id>/image.jpg`

After uploading, set the matching column (`trips.hero_photo_url`, `stops.photo_url`, `activities.image_url`) for each row below.

## 1. Hero photo (1)

| Trip id | Base64 length |
|---|---|
| `cb2a7994-4560-4118-9bb2-100d371785cf` | 120,043 chars |

## 2. Stop photos (6 of 8; 2 have none)

| Stop | Stop id | Base64 length |
|---|---|---|
| Hanoi | `03626c17-7523-4a65-a01b-a76383a9819e` | 254,527 chars |
| Sapa | `c65ba83b-2162-4ebd-a0aa-03a1b437f908` | 156,551 chars |
| Ninh Binh | `503bc2cd-f027-40b2-94af-906ef8c47b81` | 78,091 chars |
| Ha Long Bay | `502516a5-bd2f-498e-94e9-9adf0ae65f57` | 120,043 chars |
| Da Nang | `221dac4d-efb5-49e7-87a6-0ab9f949848d` | 37,803 chars |
| Phu Quoc | `9938b60d-0ee4-45e3-85b1-8392b0c25133` | 195,191 chars |

No photo in source data:

- Ho Chi Minh City (`417460c9-dbbb-4d3e-9148-ad1a009ac7de`)
- Hanoi (return) (`143db267-afb2-43e9-9356-32ceabcb0728`)

## 3. Activity images (56 of 57; 1 has none)

| Stop | Activity | Activity id | Base64 length |
|---|---|---|---|
| Hanoi | Train Street | `a931d935-2aa9-4773-9e6d-1f91f4b16d0f` | 254,527 chars |
| Hanoi | Incense Village | `2fe55038-ffaa-4fa5-b7f7-18e8e8d0846d` | 89,335 chars |
| Hanoi | Old Quater | `93db6dc8-4304-46b4-988a-7f083bab13d7` | 132,231 chars |
| Hanoi | X Space Immersive | `8b85cbce-e49f-4bee-8faa-f0da3b2770d6` | 156,491 chars |
| Hanoi | Tran Quoc Pagoda | `5cb137a4-8af5-495c-8a77-9396248c92ec` | 124,307 chars |
| Hanoi | St Joseph's Cathedral | `8472484f-d41a-4509-a006-35a3b2756daa` | 203,451 chars |
| Hanoi | Silk Street | `083abba4-b86a-40d1-84c6-54040bbdedfa` | 152,431 chars |
| Hanoi | Rainbow Slide | `8adf8643-f7dd-4780-bbfe-3d9094d90359` | 113,219 chars |
| Hanoi | Note Coffee | `28115104-15a8-4b7a-8cf8-c7dc0f1458f2` | 155,855 chars |
| Hanoi | "Walking Street" (beer from $1) | `37b3ba6a-071c-44b0-81bf-ff2b1a2787e6` | 298,963 chars |
| Hanoi | City Sightseeing Bus Tour | `ccf72943-a320-47bf-9d09-f73bf5d7ea05` | 96,451 chars |
| Hanoi | Infinity Beach Quang Lang | `1f30b913-4cbe-4d01-8ccf-8a30477703f4` | 29,495 chars |
| Hanoi | Mega Grand World | `047df64c-dbbb-4b2b-be58-6edc362f3287` | 99,495 chars |
| Hanoi | Chuong Conical Hat Village | `9775aa16-eb7b-4ac8-b001-3b408bdc0f17` | 73,219 chars |
| Hanoi | Van Phuc Silk Village | `31c3055e-caba-4446-8129-dfc6f8fcf0c3` | 248,307 chars |
| Hanoi | Thai Cooking Classes for Kids | `1856ef2b-c845-40f0-bf1d-a3f539211ea2` | 89,151 chars |
| Sapa | Rong May Glass Bridge | `139065c1-6095-4c46-96b9-14a66f311db7` | 82,623 chars |
| Sapa | Fansipan Peak | `8d4541f5-bf11-4052-9136-6f8001b0568a` | 62,535 chars |
| Sapa | Muong Hoa Funicular | `d4f202a2-af18-4ee0-b7d9-f5a34812f8c0` | 60,823 chars |
| Sapa | CatCat Village | `60f0ffaf-6e7a-4202-afd6-84e0f21b9027` | 227,887 chars |
| Sapa | Rainbow Slide | `c4fc9fbf-3eef-41f8-a0e9-a51d2d96a57e` | 101,667 chars |
| Sapa | Alpine Coaster | `77f0b100-edca-4e54-9fba-33ec6b27c838` | 183,003 chars |
| Sapa | Moana | `714d3830-fc04-4408-aebb-adf20ff76076` | 20,611 chars |
| Sapa | Infinity Hand | `d3fdd1c2-9687-4532-b396-4979572c3f15` | 24,467 chars |
| Sapa | Fansipan Cable Car | `6560058a-ab1f-46e2-94e4-66ea880a9fea` | 51,991 chars |
| Sapa | Love Waterfall | `cb22b215-0b80-4757-8685-8bae84413bfb` | 97,015 chars |
| Sapa | Mario Kart O Quy Ho Fairy Valley | `4078e00b-980e-4dbd-a8f0-7f3fa233c01d` | 55,919 chars |
| Ninh Binh | Tam Coc Boat Tour | `68f066a3-4b46-4f5e-8cc5-94a7e272e4a6` | 137,795 chars |
| Ninh Binh | Bich Dong Pagoda | `90a29cb6-cf91-4e19-a4ba-55188d96bb36` | 259,583 chars |
| Da Nang | Ba Na Hills | `82eeacc3-28fd-4ef6-90cd-0dbcf1f70fe8` | 206,363 chars |
| Da Nang | Dragon Bridge (weekend fire) | `3dc9fa54-fc53-455f-a895-333499844767` | 108,887 chars |
| Da Nang | Hoi An Lanterns | `5be83d4d-3438-4d82-923a-f8f9df47e824` | 81,179 chars |
| Da Nang | Marble Mountains | `fdf85654-b323-4d08-bc00-9cd635ce0b44` | 160,399 chars |
| Da Nang | Son Tra Night Market | `96fdd3f6-18ce-4e72-bf2c-6e14afc17f47` | 167,575 chars |
| Da Nang | Market Shopping | `68d0607a-9768-41b0-b8c4-411936891768` | 100,531 chars |
| Da Nang | Coconut Boat | `2002ece3-7890-4050-9cfb-eb6ddefb0c30` | 138,015 chars |
| Da Nang | VinWonders Amusement Park | `0017698d-6dfc-4f7f-a901-04a8d1d39f32` | 148,439 chars |
| Da Nang | Sunrise Paddle Boarding | `53f4a82f-4335-43f3-94b4-c1573f973564` | 60,627 chars |
| Da Nang | Hoi An Memories Show | `fc88efa9-8dbd-423d-a605-41861808b751` | 121,067 chars |
| Da Nang | Alpine Coaster Ba Na Hills | `055ea83a-06e1-4e02-a0b0-ce1cfc5be6ab` | 89,755 chars |
| Ho Chi Minh City | Suoi Tien Theme Park | `d38ef7a0-a35a-4d14-935b-710de1e7ad85` | 95,391 chars |
| Ho Chi Minh City | Saigon Central Post Office | `8ac30054-cd55-4d82-99ec-030c716402ae` | 89,175 chars |
| Ho Chi Minh City | Golden Dragon Water Puppet Theatre | `ddacd7f6-7921-474c-9a4c-8350f0fb51d0` | 76,543 chars |
| Ho Chi Minh City | Aimbox: Human Claw Machine | `327bd949-21e1-46c5-8710-fb398a796318` | 79,999 chars |
| Ho Chi Minh City | Paddleboarding on Siagon River | `ee6303bb-faa0-4fe0-b5ab-0efa7942a185` | 32,479 chars |
| Ho Chi Minh City | Cafe Apartments | `b752d606-33a4-436c-a208-0089a7dda255` | 76,635 chars |
| Ho Chi Minh City | Vuon Thien Gioi Coffee | `05750c09-c328-4fbc-8a89-d8bd950fb8e3` | 169,279 chars |
| Ho Chi Minh City | Wagwel Adoption Cafe | `43cebb18-c8eb-4c2e-ba72-11bd16505992` | 75,615 chars |
| Phu Quoc | Phu Quoc Aquarium | `b9935019-1f0d-485e-8401-43b544fbfa8d` | 223,751 chars |
| Phu Quoc | Hon Thom Cablecar | `63c1ca68-264f-42aa-b03e-b4063f170f33` | 130,183 chars |
| Phu Quoc | Grand World Phu Quoc | `f2a67f9c-8294-4ac8-b252-a66fe690b88c` | 229,895 chars |
| Phu Quoc | Kissing Bridge | `355d655d-8931-4586-b65e-9feb865660e5` | 97,307 chars |
| Phu Quoc | Teddy Bear Museum | `d9661a56-5ade-4b01-981b-7d48b119d91a` | 112,755 chars |
| Phu Quoc | VinPearl Safari | `368cb2cf-cd4e-44fa-84e4-e0b774e36d3c` | 138,043 chars |
| Phu Quoc | Sao Beach (starfish beach) | `8a2fc51b-cf18-4b34-a670-e71ae5a651ff` | 45,195 chars |
| Phu Quoc | Phu Quoc Night Market | `323cd840-8416-4f42-a2c8-ca1c189a52d2` | 260,627 chars |

No image in source data:

- Hanoi: Bat Trang Pottery Village (`c4f11802-2b47-48b1-a9a7-d75e88396522`)

## 4. Accommodation images

None — no accommodation rows exist yet.

## Summary

- Hero: 1
- Stop photos: 6
- Activity images: 56
- Accommodation: 0
- **Total: 63**
