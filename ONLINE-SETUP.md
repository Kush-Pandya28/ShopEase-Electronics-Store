# ShopEase ne online mukvu (PC band / sleep hoy tyare pan phone par chale)

Website ek free cloud server (**Render**) par chalshe, ane data ek free cloud database (**MongoDB Atlas**) ma rahese.
Pachhi tamaro PC band hoy, sleep ma hoy ke internet vagar hoy, to pan link koi pan phone ke network par khulshe.

Kul samay: lagbhag 20-30 minute, ek j vaar. Badhu **free** chhe, credit card ni jarur nathi.

---

## Pagalu 1 - MongoDB Atlas (data mate, free)

1. <https://www.mongodb.com/cloud/atlas/register> par jao ane Google thi sign up karo.
2. **Create a deployment** / **Build a Database** -> **M0 (Free)** pasand karo -> Provider **AWS**, Region **Mumbai (ap-south-1)** -> **Create**.
3. "Connect to Cluster" vindo aave:
   - **Username**: `shopease`
   - **Password**: **Autogenerate** dabavo ane password kyank copy kari ne sachavi rakho
   - **Create Database User**
4. Dabi baju menu ma **Network Access** -> **Add IP Address** -> **Allow access from anywhere** (`0.0.0.0/0`) -> **Confirm**.
   (Render nu IP badlatu rahe chhe, etle aa jaruri chhe. Database password thi surakshit rahe chhe.)
5. **Database** -> **Connect** -> **Drivers** -> connection string copy karo. Te aavu dekhashe:
   `mongodb+srv://shopease:<db_password>@cluster0.abcd123.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
6. Temaa be ferfar karo:
   - `<db_password>` ni jagyae pagalu 3 no password lakho
   - `.mongodb.net/` pachhi `shopease` lakho -> `...mongodb.net/shopease?retryWrites=...`

   Aa aakhi line ne **MONGO_URI** kahe chhe. Kyank Notepad ma sachavi rakho (koi ne aapsho nahi).

## Pagalu 2 - (marji mujab) aa PC no data cloud ma copy karo

Tamaru account, orders ane products online pan joie to:
ShopEase aa PC par chalu hoy tyare **`copy-data-to-cloud.bat`** double-click karo, ane MONGO_URI paste karo.

Aa pagalu chhodi do to online store 105 sample products sathe navo shuru thase (tame tya fari register kari shako).

## Pagalu 3 - GitHub (code mate, free)

1. <https://github.com/signup> par account banavo.
2. Upar jamani baju **+** -> **New repository**
   - Repository name: `shopease`
   - **Private** pasand karo
   - README / .gitignore kai **na** umero -> **Create repository**
3. Je page khule tema `https://github.com/<tamaru-naam>/shopease.git` lakhelu hoy te address copy karo.
4. Project folder ma **`publish-online.bat`** double-click karo -> address paste karo -> Enter.
   Pehli vaar browser ma GitHub login puchhse - **Sign in with your browser** -> **Authorize**.

> Passwords (`server\.env`), aa PC no database ane logs **kyarey upload thata nathi**.

## Pagalu 4 - Render (website chalavva, free)

1. <https://dashboard.render.com/register> -> **GitHub** thi sign up karo.
2. **New +** -> **Blueprint** -> GitHub connect karo -> `shopease` repository pasand karo -> **Connect**.
3. Render 4 vastu puchhse:

   | Name | Shu lakhvu |
   |---|---|
   | `MONGO_URI` | Pagalu 1 ni line |
   | `ADMIN_NAME` | Tamaru naam, jem ke `Kush Pandya` |
   | `ADMIN_LOGIN_EMAIL` | Admin login email |
   | `ADMIN_LOGIN_PASSWORD` | **Navo majboot password** (8+ akshar, akshar + ank + symbol). Internet par chhe, etle saral password na rakho. |

4. **Apply** dabavo. 5-10 minute ma build puru thase (Logs ma `ShopEase API running in production mode` aavshe).
5. Upar link dekhashe: **`https://shopease-xxxx.onrender.com`** - aa j tamari kayam ni link chhe.
   Phone ma kholo - mobile data par pan chalshe. PC band hoy to pan.

## Pachhi ferfar online mukva

Project ma kai badlo to **`publish-online.bat`** fari double-click karo. Render aapmele navu version 5 minute ma mukshe.

---

## Dhyan ma rakhvu

- **Free plan ma 15 minute koi na khole to server sui jay chhe.** Pachhi pehli vaar kholta 30-60 second lage (loading dekhashe), pachhi fast chale.
  Hamesha fast joie to Render ma plan **Starter ($7/mahino)** kari shakay.
- **Online payment:** Razorpay keys umero tyare j chalshe (Render -> shopease -> **Environment** -> `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`). Tya sudhi checkout ma aapmele **Cash on Delivery** aave chhe.
- **Emails:** Render -> Environment ma `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=<gmail>`, `SMTP_PASS=<Gmail App Password>` umero.
- **Admin mathi upload karela photos:** Render nu disk dar deploy pachhi saaf thay chhe, etle photos kayam mate [Cloudinary](https://cloudinary.com) (free) na 3 keys Environment ma umero. Sample product photos hamesha chale chhe.
- **Demo customer** (`customer@shopease.com` / `Customer@123`) online pan chhe - customer account chhe, admin nahi. Na joie to admin panel -> Users mathi block kari shako.
- Aa PC vadu ShopEase (`localhost:5000`) alag j chalu rahe chhe; teno data ane online data alag chhe.
