app.post('/api/auth/register', async (req,res)=>{
  if (!consumeAuthRateLimit(req, "register")) return res.status(429).json({error:'تم تجاوز عدد محاولات التسجيل من هذا العنوان. حاول لاحقًا.'});
  if (!(await requireTurnstile(req, res))) return;
  try{
    const name=String(req.body.name||'').trim(), username=normalizeUsername(req.body.username), email=String(req.body.email||'').trim().toLowerCase(), password=String(req.body.password||'');
    // Authentication is email/password only. Phone/SMS is not part of account registration.
    const deviceId=String(req.body.deviceId||'').trim().slice(0,200);
    if(name.length<2)return res.status(400).json({error:'الاسم مطلوب'});
    if(!/^[a-z0-9_.-]{3,30}$/.test(username))return res.status(400).json({error:'اسم المستخدم يجب أن يكون من 3 إلى 30 حرفًا، باستخدام حروف إنجليزية أو أرقام أو _ أو - أو .'});
    if(!/^\S+@\S+\.\S+$/.test(email))return res.status(400).json({error:'البريد الإلكتروني غير صحيح'});
    if(password.length<8)return res.status(400).json({error:'كلمة المرور يجب أن تكون 8 أحرف على الأقل'});
    if(db.prepare('SELECT id FROM users WHERE email=?').get(email))return res.status(409).json({error:'البريد الإلكتروني مستخدم بالفعل'});
    if(db.prepare('SELECT id FROM users WHERE username=?').get(username))return res.status(409).json({error:'اسم المستخدم مستخدم بالفعل.'});
    const id=`usr_${crypto.randomUUID()}`, now=new Date().toISOString();
    db.prepare("INSERT INTO users (id,email,username,password_hash,display_name,created_at,phone,phone_verified,activation_status,trip_free_searches) VALUES (?,?,?,?,?,?,?,?,?,0)").run(id,email,username,hashPassword(password),name,now,null,0,'active');
    const user={id,email,username,name,phone:undefined,phoneVerified:false,activationStatus:'active'};
    res.json({ token:createSession(id), user });
  }catch(e:any){res.status(500).json({error:e.message||'تعذر إنشاء الحساب'});}
});
