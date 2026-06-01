import { sendEmail, getDailyStats } from '../src/mailer.js';

const outreach = [
  { to: 'adam@redbarnrobotics.com', company: 'Red Barn Robotics', body: `Hey Adam,

Red Barn Robotics is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'cayden@mentra.glass', company: 'Mentra', body: `Hey Cayden,

Mentra caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'bernardo@blindpay.com', company: 'BlindPay', body: `Hey Bernardo,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought BlindPay would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'love@vantel.ai', company: 'Vantel', body: `Hey Love,

Vantel is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'alex@firaresearch.com', company: 'Fira', body: `Hey Alex,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Fira seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'simon@assistant-ui.com', company: 'assistant-ui', body: `Hey Simon,

assistant-ui is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'ross@artifact.engineer', company: 'Artifact', body: `Hey Ross,

Artifact caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'samai@axal.ai', company: 'Axal', body: `Hey Samai,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Axal would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'regina@getdexterity.com', company: 'Dexterity', body: `Hey Regina,

Dexterity is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'jarrett@tallyhq.com', company: 'Tally', body: `Hey Jarrett,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Tally seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'joe@sammylabs.com', company: 'Sammy Labs', body: `Hey Joe,

Sammy Labs is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'alex@instinct-space.com', company: 'Instinct', body: `Hey Alex,

Instinct caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'lukas@mercura.ai', company: 'Mercura', body: `Hey Lukas,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Mercura would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'joshua@tamlabs.ai', company: 'TamLabs', body: `Hey Joshua,

TamLabs is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'graham@runcopycat.com', company: 'CopyCat', body: `Hey Graham,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. CopyCat seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'pablo@paratushealth.com', company: 'Paratus Health', body: `Hey Pablo,

Paratus Health is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'tycho@tensorpool.dev', company: 'TensorPool', body: `Hey Tycho,

TensorPool caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'sebastian@dalus.io', company: 'Dalus', body: `Hey Sebastian,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Dalus would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'celia@rebolt.ai', company: 'Rebolt', body: `Hey Celia,

Rebolt is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'manu@spott.io', company: 'Spott', body: `Hey Manu,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Spott seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'ben@withwoz.com', company: 'Woz', body: `Hey Ben,

Woz is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'jay@proception.ai', company: 'Proception', body: `Hey Jay,

Proception caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'dev@joindemeter.com', company: 'Demeter', body: `Hey Dev,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Demeter would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'kaushik@wild-card.ai', company: 'Wildcard', body: `Hey Kaushik,

Wildcard is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'adam@permitify.com', company: 'Permitify', body: `Hey Adam,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Permitify seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'stef@reditus.space', company: 'Reditus Space', body: `Hey Stef,

Reditus Space is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'christian@startpinch.com', company: 'Pinch', body: `Hey Christian,

Pinch caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'sandra@retrofit.shop', company: 'Retrofit', body: `Hey Sandra,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Retrofit would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'george@archon.inc', company: 'Archon', body: `Hey George,

Archon is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'sam@mastra.ai', company: 'Mastra', body: `Hey Sam,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Mastra seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'carlos@afterquery.com', company: 'AfterQuery', body: `Hey Carlos,

AfterQuery is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'boateng@fuse.ai', company: 'Fuse AI', body: `Hey Boateng,

Fuse AI caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'tyrone@miyagilabs.ai', company: 'Miyagi Labs', body: `Hey Tyrone,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Miyagi Labs would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'yash@triplezip.ai', company: 'TripleZip', body: `Hey Yash,

TripleZip is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'sachitt@usepeppr.ai', company: 'Peppr', body: `Hey Sachitt,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Peppr seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'sriman@sennu.ai', company: 'Sennu AI', body: `Hey Sriman,

Sennu AI is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'ben@orbitalops.tech', company: 'Orbital Operations', body: `Hey Ben,

Orbital Operations caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'saurabh@usemesh.com', company: 'Mesh', body: `Hey Saurabh,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Mesh would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'josh@outlit.ai', company: 'Outlit', body: `Hey Josh,

Outlit is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'dakotah@harperinsure.com', company: 'Harper', body: `Hey Dakotah,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Harper seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'kun@calltree.ai', company: 'Calltree AI', body: `Hey Kun,

Calltree AI is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'ben@nitrode.com', company: 'Nitrode', body: `Hey Ben,

Nitrode caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'shahryar@gokarsa.com', company: 'Karsa', body: `Hey Shahryar,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Karsa would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'pranav@exla.ai', company: 'Exla', body: `Hey Pranav,

Exla is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'shaun@withriviera.com', company: 'Riviera', body: `Hey Shaun,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Riviera seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'charlie@vovana.com', company: 'Vovana', body: `Hey Charlie,

Vovana is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'sankeerth@agentin.ai', company: 'Agentin AI', body: `Hey Sankeerth,

Agentin AI caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'wilco@rejot.dev', company: 'ReJot', body: `Hey Wilco,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought ReJot would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'joshua@generaltrajectory.com', company: 'General Trajectory', body: `Hey Joshua,

General Trajectory is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'mark@solidroad.com', company: 'SolidRoad', body: `Hey Mark,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. SolidRoad seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'eric@trytrata.com', company: 'Trata', body: `Hey Eric,

Trata is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'ansh@sophris.ai', company: 'Sophris', body: `Hey Ansh,

Sophris caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'abhinav@lucidic.ai', company: 'Lucidic AI', body: `Hey Abhinav,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Lucidic AI would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'naijide@mundoai.world', company: 'Mundo AI', body: `Hey Naijide,

Mundo AI is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'alan@athenahq.ai', company: 'AthenaHQ', body: `Hey Alan,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. AthenaHQ seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'aamish@lopus.ai', company: 'Lopus AI', body: `Hey Aamish,

Lopus AI is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'kofi@joincenote.com', company: 'Cenote', body: `Hey Kofi,

Cenote caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'sophia@harbera.com', company: 'Harbera', body: `Hey Sophia,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Harbera would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'linus@augento.ai', company: 'Augento', body: `Hey Linus,

Augento is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'haokun@galevisa.com', company: 'Gale', body: `Hey Haokun,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Gale seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'josh@pave-robotics.com', company: 'Pave Robotics', body: `Hey Josh,

Pave Robotics is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'bardia@fromolive.com', company: 'Olive', body: `Hey Bardia,

Olive caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'jay@hud.so', company: 'HUD', body: `Hey Jay,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought HUD would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'yong@cuckoo.so', company: 'Cuckoo Labs', body: `Hey Yong,

Cuckoo Labs is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'ahmed@mecha-health.ai', company: 'Mecha Health', body: `Hey Ahmed,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Mecha Health seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'max@gradewiz.ai', company: 'GradeWiz', body: `Hey Max,

GradeWiz is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'josh@gethealthkey.com', company: 'HealthKey', body: `Hey Josh,

HealthKey caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'moses@mosaicco.com', company: 'Mosaic', body: `Hey Moses,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Mosaic would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'ghita@zeroentropy.dev', company: 'ZeroEntropy', body: `Hey Ghita,

ZeroEntropy is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'areg@cardamon.ai', company: 'Cardamon', body: `Hey Areg,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Cardamon seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'yos@tryamby.com', company: 'Amby Health', body: `Hey Yos,

Amby Health is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'alex@carecycle.ai', company: 'careCycle', body: `Hey Alex,

careCycle caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'ishir@heysift.com', company: 'Sift Dev', body: `Hey Ishir,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Sift Dev would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'david@maive.ai', company: 'Maive', body: `Hey David,

Maive is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'ethan@caseflood.ai', company: 'Caseflood', body: `Hey Ethan,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Caseflood seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'gaurav@trytejas.ai', company: 'Tejas AI', body: `Hey Gaurav,

Tejas AI is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'pushkar@usevora.ai', company: 'Vora AI', body: `Hey Pushkar,

Vora AI caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'justin@maritimefusion.com', company: 'Maritime Fusion', body: `Hey Justin,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Maritime Fusion would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'pasha@a1base.com', company: 'A1Base', body: `Hey Pasha,

A1Base is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'kashyab@verbiflow.com', company: 'Verbiflow', body: `Hey Kashyab,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Verbiflow seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'johnny@toothy.ai', company: 'Toothy AI', body: `Hey Johnny,

Toothy AI is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'alan@rocketable.com', company: 'Rocketable', body: `Hey Alan,

Rocketable caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'dylan@sublingual.ai', company: 'Sublingual', body: `Hey Dylan,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Sublingual would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'aditya@contrario.ai', company: 'Contrario', body: `Hey Aditya,

Contrario is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'andrew@ovlo.ai', company: 'Ovlo', body: `Hey Andrew,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Ovlo seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'shaunak@trytruffle.ai', company: 'Truffle AI', body: `Hey Shaunak,

Truffle AI is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'adina@superglue.ai', company: 'superglue', body: `Hey Adina,

superglue caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'aaron@closure-intel.com', company: 'Closure', body: `Hey Aaron,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Closure would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'prithvi@gopromptless.ai', company: 'Promptless', body: `Hey Prithvi,

Promptless is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'pranav@scoutforschools.com', company: 'Scout', body: `Hey Pranav,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Scout seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'adhityaa@subtrace.dev', company: 'Subtrace', body: `Hey Adhityaa,

Subtrace is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'brogan@vocalityhealth.com', company: 'Vocality Health', body: `Hey Brogan,

Vocality Health caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'alex@astroenergy.ai', company: 'Astro', body: `Hey Alex,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought Astro would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'thomas@dollyglot.com', company: 'Dollyglot', body: `Hey Thomas,

Dollyglot is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'archit@stampmail.ai', company: 'Stamp', body: `Hey Archit,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Stamp seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'kevin@guse.io', company: 'Guse', body: `Hey Kevin,

Guse is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'alex@subimage.io', company: 'SubImage', body: `Hey Alex,

SubImage caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.

Open to a quick conversation?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'jason@nextbyte.ai', company: 'NextByte', body: `Hey Jason,

I make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought NextByte would be a great fit.

Interested?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'kevin@leapingai.com', company: 'Leaping AI', body: `Hey Kevin,

Leaping AI is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.

Worth a quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
  { to: 'roop@bild.ai', company: 'Bild AI', body: `Hey Roop,

I make short motion graphic brand videos for AI startups — clean explainers that make your product pop. Bild AI seems like a strong fit.

Quick chat?

— Jay
jayrx.net
jayrx16@gmail.com` },
];

async function runBatch() {
  const stats = getDailyStats();
  if (stats.remaining === 0) {
    console.log('Daily limit already reached. Try again tomorrow.');
    process.exit(0);
  }

  const toSend = outreach.slice(0, stats.remaining);
  console.log(`Sending ${toSend.length} emails (${stats.remaining} remaining today)...`);

  let sent = 0;
  let failed = 0;

  for (const email of toSend) {
    try {
      await sendEmail({
        to: email.to,
        subject: `Quick brand video idea for ${email.company}`,
        body: email.body,
      });
      console.log(`✓ ${email.company} → ${email.to}`);
      sent++;
    } catch (err) {
      console.error(`✗ ${email.company} → ${email.to}: ${err.message}`);
      failed++;
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`
Done. ${sent} sent, ${failed} failed.`);
}

runBatch();
