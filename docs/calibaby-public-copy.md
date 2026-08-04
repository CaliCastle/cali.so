# Cali Baby public copy

Status: draft for content review

This document is the copy source for the Cali Baby support hub, Privacy Policy, Terms of Use, and Settings destinations. Chinese and English are written as native versions of the same product and legal commitments, not line-by-line translations.

## Publication gates

Do not publish these pages until all of the following are true:

- Account deletion, Family deletion, explicit ownership transfer, managed mutation-history removal, orphaned asset cleanup, regional source-copy deletion, and the agreed purge behavior are implemented and verified.
- Server voice audio objects, upload rows, transcripts, interpretations, and job metadata are physically purged from Cali Baby-controlled systems within 24 hours, with verified retries on failure.
- PostHog usage analytics is explicit opt-in and its event properties are restricted to an approved non-content allowlist.
- PostHog and Sentry identifier, retention, and account-deletion behavior is documented and implemented; Sentry content scrubbing is applied consistently to iOS and backend diagnostics.
- Live Global and China infrastructure, voice-provider, cross-border, backup, and provider-retention details are reverified against deployment configuration and provider agreements.
- Any feature-specific notice or consent required for sensitive or cross-border processing is implemented before the related processing begins.
- App Store privacy labels and account-deletion disclosures match this policy, and Settings and paywall links use the correct localized Cali Baby routes.
- Region selection and migration explain any operator change and require confirmation before data transfer; app, App Store, copyright, and support metadata use the same operator model.
- Vercel Web Analytics collection and retention for the public support and legal pages is verified against this disclosure.
- The final effective date is set.
- Counsel has reviewed the eligibility, warranty, liability, consumer-rights, cross-border processing, and governing-law language.

## Settings actions

| Chinese | English | Behavior |
| --- | --- | --- |
| 给个好评 | Write a Review | Use Apple's native in-app review prompt until a numeric App Store ID is configured, then open the public App Store review page. |
| 提交反馈 | Send Feedback | Email `hi@cali.so` with subject `Cali Baby Feedback`. |
| 联系我们 | Contact Us | Email `hi@cali.so` with subject `Cali Baby Support`. |
| 使用条款 | Terms of Use | Open the Terms page for the current app language. |
| 隐私政策 | Privacy Policy | Open the Privacy page for the current app language. |

---

## 中文产品与支持页

Route: `/calibaby/help`

Metadata title: `Cali 宝宝助手｜帮助与支持`

Metadata description: `查找家庭同步、备份、语音记录和账号删除帮助，了解 Cali 宝宝助手，或联系我们。`

# Cali 宝宝助手

孕期和照顾宝宝的每一天，都有很多小事要记。喂奶、睡眠、尿布、体温，还有那些当下觉得不会忘，过两个小时就真的想不起来的细节。

Cali 宝宝助手把这些记录放在一起，也让获得授权的家人看到同一份近况。这样，你不必把一整天都记在脑子里，可以把心力留给眼前的人。

需要帮助？你可以直接查看[家庭同步](#家庭同步没有更新)、[备份与恢复](#备份与恢复)、[账号与家庭删除](#删除账号)，或者[联系我们](#联系我们)。

## 记录从设备开始

你的记录会先保存在设备上。登录后，你可以开启家庭同步，让宝宝资料和支持同步的照顾记录在你的设备与家庭成员之间保持一致。

家庭同步不是必需的。如果你只想在一台设备上使用，也可以继续本地记录。你还可以从「设置」导出备份文件。导出后，文件由你保管，请把它放在可信的位置。

## 和家人一起照顾

家庭成员可以查看和添加家庭中的宝宝资料与照顾记录。只邀请你信任，而且有权查看宝宝信息的人。

每个家庭都有一位拥有者。拥有者负责家庭成员和家庭本身。如果家庭里还有其他照顾者，拥有者必须先明确转移所有权，才能删除自己的账号。Cali 宝宝助手不会自动把其他人设为拥有者。

## 语音记录

语音记录会优先使用设备上的 Apple 语音能力。若本地转写不可用，服务器处理可能会把录音交给第三方语音服务转写，并用 OpenAI 帮助把文字整理成可确认的记录。

服务器处理完成后会安排删除录音。Cali 宝宝助手控制的录音、上传资料、转写文字和任务资料会在 24 小时内删除。你仍然需要在保存前检查内容，尤其是时间、数量和照顾类型。

## 常见帮助

### 家庭同步没有更新

先确认每台设备都登录了正确的账号、选择了同一个服务区域，并加入了同一个家庭。保持网络连接后重新打开 App。若问题仍然存在，请联系我们，并附上 App 版本、设备型号和大致发生时间。请不要在邮件里发送宝宝的完整记录、照片或其他敏感信息。

### 备份与恢复

你可以在「设置」中导出或导入备份。导入备份可能覆盖或合并设备上的资料；如果家庭同步已开启，支持同步的导入记录也可能同步到家庭。开始前，请确认你选择了正确的备份文件和家庭。

### 删除账号

删除账号会删除你的登录身份和家庭成员关系，但不会删除仍由其他照顾者共享的家庭记录。如果你是家庭拥有者，而且还有其他成员，你需要先把所有权转移给其中一位成员。

### 删除家庭

只有家庭拥有者可以删除家庭。删除家庭会移除家庭中的宝宝资料、照顾记录、照片、成员、设备、邀请和恢复资料。此操作无法撤销，App 会先显示删除范围，再要求最终确认。

如果你是家庭中唯一的拥有者，删除账号时需要通过合并流程一起删除家庭，不能留下没有拥有者的家庭。

## 联系我们

使用问题、功能建议或一般反馈，请发邮件到 [hi@cali.so](mailto:hi@cali.so?subject=Cali%20Baby%20Support)。

隐私、数据权利或法律相关请求，请发邮件到 [contact@zolplay.com](mailto:contact@zolplay.com?subject=Cali%20Baby%20Privacy%20Request)。

我们可能需要核实你的身份，但不会通过邮件索取密码、家庭密钥或完整的照顾记录。

## 健康与紧急情况

Cali 宝宝助手用于记录和整理日常观察，不提供诊断、治疗建议或紧急服务，也不能代替医生或其他专业人员。

如果你认为家长、孕妇或宝宝正处于紧急情况，请立即联系当地急救服务或合适的医疗专业人员，不要等待 App 支持回复。

## 法律信息

- [隐私政策](/calibaby/privacy)
- [使用条款](/calibaby/terms)

---

## English product and support page

Route: `/en/calibaby/help`

Metadata title: `Cali Baby | Help and Support`

Metadata description: `Get help with Family Sync, backups, voice records, and deletion, learn about Cali Baby, or contact support.`

# Cali Baby

Care moves quickly. Feeds, sleep, diapers, temperature, and all the details that feel impossible to forget until two hours later.

Cali Baby keeps those records together and helps authorized caregivers see the same recent picture. You don't have to hold the whole day in your head. Save that attention for the person in front of you.

Need help? Jump to [Family Sync](#family-sync-isnt-updating), [backup and restore](#back-up-or-restore-records), [account and Family deletion](#delete-an-account), or [contact us](#contact-us).

## Your records start on your device

Records are saved on your device first. If you sign in, you can use Family Sync to keep your Baby Profile and supported care records available across your devices and with authorized Family members.

Family Sync is optional. You can keep recording on one device without it. You can also export a backup from Settings. Once exported, that file is under your control, so keep it somewhere you trust.

## Care together

Family members can view and add Baby Profile information and care records in the Family. Invite only people you trust and who are authorized to see the baby's information.

Every Family has one Owner. The Owner manages membership and the Family itself. If other caregivers remain, the Owner must explicitly transfer ownership before deleting their account. Cali Baby never promotes someone automatically.

## Voice records

Voice records prefer Apple's on-device speech features. If local transcription isn't available, server processing may send the recording to a third-party speech service for transcription and use OpenAI to help turn the transcript into a record you can review.

Server-processed audio is scheduled for deletion after processing. Audio, upload information, transcripts, and job metadata controlled by Cali Baby are deleted within 24 hours. Always check the result before saving, especially the time, quantity, and type of care.

## Common questions

### Family Sync isn't updating

Check that each device is signed into the right account, uses the same service region, and belongs to the same Family. Reopen the app with a working connection. If the problem continues, contact us with the app version, device model, and approximate time it happened. Please don't email complete care records, photos, or other sensitive information.

### Back up or restore records

You can export or import a backup from Settings. Importing can replace or merge information on the device. If Family Sync is on, supported imported records may also be queued for Family Sync. Check the backup file and Family before you begin.

### Delete an account

Deleting an account removes that caregiver's sign-in identity and Family memberships. It doesn't delete Family records that remain shared with other caregivers. If you're the Family Owner and other members remain, you must transfer ownership first.

### Delete a Family

Only the Family Owner can delete a Family. Family deletion removes its Baby Profiles, care records, photos, members, devices, invites, and recovery data. It can't be undone, so the app shows what will be removed before asking for final confirmation.

If you're the sole Family Owner, deleting your account uses the combined flow to delete the Family too. A Family can't be left without an Owner.

## Contact us

For help, feature ideas, or general feedback, email [hi@cali.so](mailto:hi@cali.so?subject=Cali%20Baby%20Support).

For privacy, data-rights, or legal requests, email [contact@zolplay.com](mailto:contact@zolplay.com?subject=Cali%20Baby%20Privacy%20Request).

We may need to verify your identity, but we'll never ask for your password, Family key, or complete care history by email.

## Health and emergencies

Cali Baby helps you record and organize everyday observations. It doesn't provide a diagnosis, medical treatment, or emergency services, and it doesn't replace a doctor or other qualified professional.

If you believe a parent, pregnant person, or baby may be in danger, contact local emergency services or an appropriate medical professional immediately. Don't wait for app support.

## Legal

- [Privacy Policy](/en/calibaby/privacy)
- [Terms of Use](/en/calibaby/terms)

---

## 中文隐私政策

Route: `/calibaby/privacy`

Metadata title: `Cali 宝宝助手隐私政策`

Metadata description: `了解 Cali 宝宝助手如何处理设备记录、家庭同步、语音、分析、诊断和删除请求。`

# Cali 宝宝助手隐私政策

生效日期：发布时确定

这份政策说明 Cali 宝宝助手会处理哪些信息、为什么需要这些信息，以及你可以如何管理它们。Cali 宝宝助手面向父母、监护人和其他照顾者，不是供儿童直接使用的服务。

## 1. 谁负责你的信息

你在 App 中选择的服务区域决定负责 Cali 宝宝助手的运营方。界面语言不会改变运营方。

- 全球区：Zolplay LLC，1021 E Lincolnway, Cheyenne, WY 82001, USA。
- 中国区：深圳市佐玩信息技术有限公司，深圳市罗湖区桂园街道桂木园社区宝安南路2046宝丽大厦A座12G。

本政策中的「我们」指与你所选服务区域对应的运营方。两家运营方的隐私与法律联系邮箱都是 [contact@zolplay.com](mailto:contact@zolplay.com)。

如果你把家庭迁移到另一个服务区域，目标区域的运营方会负责迁移后的服务。来源区域运营方仍负责其控制的只读来源副本，直到该副本被删除。

## 2. 我们处理的信息

根据你使用的功能，我们可能处理以下信息：

- 账号资料：账号标识、邮箱、显示名称、头像、登录方式、服务区域，以及账号创建和最近使用时间。
- 宝宝与照顾资料：宝宝姓名或昵称、生日或预产期、头像，以及喂养、睡眠、尿布、体温、成长、孕期和其他你选择记录的内容。
- 你添加的内容：备注、照片、数量、时间、语音记录，以及导入的备份内容。
- 家庭资料：家庭成员和角色、邀请、设备名称、同步状态、恢复资料，以及用于协调家庭访问的技术资料。
- 购买资料：Apple 提供的产品标识、交易标识、订阅或终身购买状态、到期、退款和撤销状态。我们不会收到你的完整支付卡资料。
- 使用资料：在你明确同意使用分析后，功能和操作名称、App 版本、系统版本及粗略的使用情况。
- 诊断资料：崩溃、错误、性能、网络和请求资料，以及为保护服务而需要的安全日志。
- 网站访问资料：访问 Cali 宝宝助手产品、支持和法律页面时产生的页面访问和粗略技术资料。
- 联系资料：你发给支持或法律邮箱的内容，以及处理请求所需的后续通信。

宝宝资料、健康相关记录、照片和语音可能在你所在地区被视为敏感个人信息。请只提供你有权记录和分享的信息。

## 3. 我们为什么处理这些信息

我们使用信息来：

- 在设备上保存和显示你的记录；
- 提供账号、家庭邀请、家庭同步、备份导入与导出；
- 转写语音，并把转写内容整理成由你确认的记录；
- 验证购买和提供 Cali Baby Pro 权益；
- 回应支持、隐私和法律请求；
- 在你选择加入时了解功能的整体使用情况；
- 发现错误、保障账号与服务安全，并维持服务运行；
- 遵守适用法律和处理争议。

我们不会把照顾记录、照片、录音或转写内容用于广告。

## 4. 设备记录、备份与家庭同步

记录会先保存在你的设备上。你可以在 App 中删除本机记录，或导出备份。导出的备份文件由你控制；你选择的文件存储、云盘或分享服务会按各自的规则处理它。

如果你登录并开启家庭同步，支持同步的宝宝资料和照顾记录会发送到你选择的服务区域，并提供给同一家庭中获得授权的成员。家庭成员可以查看、添加和更改共享资料，因此请只邀请你信任且有权访问宝宝信息的人。

当前的托管家庭同步需要服务器处理可读的同步内容。它不是端到端加密服务。我们通过传输保护、访问控制和其他安全措施来保护同步资料，但你不应把家庭同步理解成我们在技术上无法读取内容。

清除一台设备上的本机资料、退出登录或删除 App，不等于删除账号或家庭中的同步资料。

## 5. 头像与照片

宝宝头像和记录内嵌的照片可能与同步记录一起存储。全球区的头像资产使用 Cloudflare R2；中国区的头像资产使用阿里云基础设施。账号头像由账号服务提供商处理。

删除家庭时，我们会删除家庭中的头像、记录照片和其他活动资产。替换或删除头像时，我们也会清理不再使用的对象。

## 6. 语音记录

语音记录优先使用设备上的 Apple 语音能力。如果本地转写不可用，服务器处理可能会：

1. 把录音上传到你所选服务区域的临时存储；
2. 通过豆包语音服务转写录音；
3. 在需要进一步理解时，把转写文字、语言、时间和必要上下文发送给 OpenAI，整理成可由你确认的记录。

第三方语音和 AI 服务可能在你所选服务区域之外处理信息。服务器处理完成后会安排删除录音；Cali 宝宝助手控制的录音、上传资料、转写文字和任务资料会在 24 小时内物理删除。第三方提供商处理期间产生的副本按各自适用的协议和法律义务保存。

最近的语音记录历史也可能保存在你的设备上，并包含在你导出的备份中。你可以在 App 中清除本机语音历史。

## 7. 使用分析与运行诊断

使用分析和运行诊断是两件不同的事。

使用分析由 PostHog 提供，只有在你明确选择加入后才会启用。它帮助我们了解哪些功能被使用，以及某个流程是否经常中断。分析资料可能包含账号或安装的假名标识、App 与系统版本、功能名称和操作结果。我们不会向使用分析发送宝宝姓名、备注、照片、录音、转写文字或具体照顾数值。你可以随时在「设置」中关闭它。

运行诊断由 Sentry 等服务提供，用于发现崩溃、错误、性能问题和安全事件。诊断资料可能包含经过限制或假名化的账号、家庭和设备标识。我们会限制和清理诊断内容，避免发送用户填写的照顾内容。关闭使用分析不会关闭这些维持服务所需的运行诊断。

当你访问 cali.so 上的产品、支持或法律页面时，Vercel Web Analytics 会处理页面访问和粗略的技术资料。网站分析不与宝宝资料或照顾记录关联，也不受 App 内 PostHog 开关控制。

PostHog 和 Sentry 可能在美国处理资料。

## 8. 我们何时向服务提供商披露信息

我们只在提供和保护 Cali 宝宝助手所需的范围内，让服务提供商处理信息。主要类别包括：

- Apple：App 分发、购买、设备能力和系统语音功能；
- Clerk：登录、账号身份和账号头像；
- Railway、Cloudflare 和阿里云：服务器、数据库和资产存储；
- 豆包：服务器语音转写；
- OpenAI：在需要时理解并整理语音转写；
- PostHog：你选择加入后的使用分析；
- Sentry：错误、崩溃和性能诊断；
- Vercel：产品、支持和法律页面的网站访问分析；
- 邮件和支持服务：处理你主动发送的请求。

这些服务提供商按我们的指示或它们与你直接适用的条款处理信息。我们也可能在法律要求、保护用户与服务安全、处理企业重组或获得你明确指示时披露必要信息。

## 9. 服务区域与跨境处理

全球区目前使用位于新加坡的服务计算资源、位于美国的数据库存储，以及 Cloudflare R2 资产存储。中国区的主要同步服务和资产使用中国大陆的阿里云基础设施。

选择服务区域不会让所有处理都只发生在该区域。账号登录、App Store 购买、你选择加入的使用分析、网站访问分析、运行诊断，以及服务器语音处理可能由区域外的提供商处理。若适用法律要求额外通知、单独同意或其他跨境手续，我们会在相关处理开始前提供。

家庭从一个区域迁移到另一个区域时，我们可能在来源区域保留只读副本，并在目标区域创建新副本。选择中国区不代表来源副本会自动删除。删除家庭会删除仍由 Cali 宝宝助手控制的活动区域副本。

## 10. 保存与删除

我们按提供功能、安全和履行法律义务所需的时间保存信息，不会仅仅因为信息以后可能有用而长期保留。

- 设备记录会保留到你在设备上删除、清除 App 资料或卸载 App。导出的备份由你管理。
- 家庭资料会保留到家庭拥有者删除家庭，或具体记录按产品功能被删除。
- 删除单条记录后，它不再作为活动记录显示或同步。旧的变更副本可能保留到同步压缩流程完成；删除家庭会一并删除这类历史内容。为防止已删除的记录重新出现，我们可能在必要期间保留不含照顾内容的删除标记。
- Cali 宝宝助手控制的服务器语音录音、上传资料、转写文字和任务资料会在 24 小时内删除。语音和 AI 提供商按各自适用的协议和法律义务处理其副本。
- 关闭使用分析后，我们会停止新的 PostHog 分析，并重置或解除 App 中的分析标识。删除账号时，我们会删除或不可逆地解除提供商中的账号分析资料。运行诊断按安全和故障处理所需的时间保留，并受内容清理规则限制。
- 网站访问分析只按汇总网站访问所需的时间和经过核实的 Vercel 保留配置保存，不与 App 内的宝宝资料或照顾记录关联。
- 支持通信、购买、反欺诈、安全和审计资料只会在处理请求、维持安全或履行法律义务所需的范围内保留。

删除账号会删除该照顾者的登录身份、账号资料和家庭成员关系，但不会删除仍与其他照顾者共享的家庭资料。如果账号拥有一个仍有其他成员的家庭，必须先明确转移所有权。

只有家庭拥有者可以删除家庭。删除家庭会从活动系统中移除宝宝资料、照顾记录、内嵌照片、头像、成员关系、设备、邀请、恢复资料和仍由我们控制的区域来源副本。如果拥有者是家庭中唯一的成员，删除账号时需要通过合并流程一起删除家庭。

最终确认后，相关访问会立即撤销。有些外部存储或提供商清理可能继续在后台进行；在所有必需的删除结果完成验证前，App 会把状态显示为「删除中」，不会提前显示为已完成。

少量不含照顾内容的 App Store 交易、反欺诈、安全和审计资料可能因法律或安全需要继续保留。受限制的备份副本也可能继续存在，直到按适用的备份覆盖周期清除；这些副本不会用于正常产品功能。

## 11. 你的选择和权利

你可以在 App 中查看或更改多数账号、宝宝和家庭资料，导出记录，管理家庭成员，关闭使用分析，删除账号，或在你是拥有者时删除家庭。

根据你所在地的法律，你也可能有权请求访问、更正、复制、删除、限制处理或撤回同意。请发邮件到 [contact@zolplay.com](mailto:contact@zolplay.com?subject=Cali%20Baby%20Privacy%20Request)。我们可能需要核实你的身份和家庭权限，然后才能处理请求。

撤回同意不会影响撤回前已经合法完成的处理。有些资料可能因法律、安全、反欺诈或争议处理需要而无法立即删除，我们会在回复中说明适用限制。

## 12. 儿童与照顾者责任

Cali 宝宝助手面向已达到所在地法定成年年龄、能够签订有效协议的父母、监护人和其他照顾者，不供儿童直接使用。

成年人可以记录儿童的信息，但必须有权提供并与家庭成员分享这些信息。不要让儿童创建账号，也不要邀请无权查看宝宝资料的人加入家庭。

## 13. 安全

我们采用传输保护、权限控制、服务隔离、日志清理和删除流程等措施来降低未经授权访问、丢失或滥用的风险。没有任何存储或传输方式能保证绝对安全。

请保护你的设备和账号，使用可靠的设备锁，不要分享登录凭证，并及时移除不再需要访问家庭资料的成员。

## 14. 不出售资料，也不投放定向广告

我们不出售个人信息，不为跨服务定向广告共享个人信息，不根据跨服务行为投放定向广告，也不会用照顾记录、照片、录音或转写内容建立广告画像。

## 15. 政策更新

如果产品、提供商或法律要求发生变化，我们可能更新本政策。重大变化会通过 App、网站或其他适当方式说明，并更新生效日期。

## 16. 联系我们

隐私、数据权利或法律请求：[contact@zolplay.com](mailto:contact@zolplay.com?subject=Cali%20Baby%20Privacy%20Request)

一般产品支持：[hi@cali.so](mailto:hi@cali.so?subject=Cali%20Baby%20Support)

邮寄地址取决于你的服务区域：

- Zolplay LLC，1021 E Lincolnway, Cheyenne, WY 82001, USA。
- 深圳市佐玩信息技术有限公司，深圳市罗湖区桂园街道桂木园社区宝安南路2046宝丽大厦A座12G。

---

## English Privacy Policy

Route: `/en/calibaby/privacy`

Metadata title: `Cali Baby Privacy Policy`

Metadata description: `Learn how Cali Baby handles device records, Family Sync, voice processing, analytics, diagnostics, and deletion requests.`

# Cali Baby Privacy Policy

Effective: To be set at publication

This policy explains what information Cali Baby handles, why we need it, and the choices you have. Cali Baby is designed for parents, guardians, and other caregivers. It isn't intended for children to use directly.

## 1. Who is responsible for your information

The service region you select in the app determines the operator responsible for Cali Baby. Your interface language doesn't change the operator.

- Global Region: Zolplay LLC, 1021 E Lincolnway, Cheyenne, WY 82001, USA.
- China Region: 深圳市佐玩信息技术有限公司, 深圳市罗湖区桂园街道桂木园社区宝安南路2046宝丽大厦A座12G, China.

In this policy, “we” means the operator for your selected service region. Both operators use [contact@zolplay.com](mailto:contact@zolplay.com) for privacy and legal requests.

If you migrate a Family to another service region, the destination operator becomes responsible for the service after migration. The source operator remains responsible for any read-only source copy it controls until that copy is deleted.

## 2. Information we handle

Depending on the features you use, we may handle:

- Account information, including account identifiers, email, display name, avatar, sign-in method, service region, and account creation or last-seen times.
- Baby and care information, including a baby's name or nickname, birth date or due date, profile photo, and feeding, sleep, diaper, temperature, growth, pregnancy, and other records you choose to add.
- Content you add, including notes, photos, quantities, times, voice records, and imported backup contents.
- Family information, including members and roles, invites, device names, sync state, recovery data, and technical information used to coordinate Family access.
- Purchase information supplied by Apple, including product and transaction identifiers, subscription or lifetime status, expiration, refund, and revocation state. We don't receive your complete payment-card information.
- Usage information, if you explicitly opt in to analytics, such as feature and action names, app version, operating-system version, and coarse usage patterns.
- Diagnostic information, including crashes, errors, performance, network and request details, and security logs needed to protect the service.
- Website-visit information, including page-view and coarse technical information generated when you visit Cali Baby product, support, or legal pages.
- Communications you send to support or legal contacts and the follow-up needed to handle your request.

Baby information, health-related records, photos, and voice may be considered sensitive personal information where you live. Only provide information you're authorized to record and share.

## 3. Why we use information

We use information to:

- Save and display records on your device.
- Provide accounts, Family invites, Family Sync, and backup import or export.
- Transcribe voice and turn a transcript into a record for you to confirm.
- Verify purchases and provide Cali Baby Pro entitlements.
- Respond to support, privacy, and legal requests.
- Understand broad feature use when you choose to opt in.
- Find errors, secure accounts and the service, and keep the service working.
- Meet legal obligations and handle disputes.

We don't use care records, photos, audio, or transcripts for advertising.

## 4. Device records, backups, and Family Sync

Records start on your device. You can delete local records in the app or export a backup. An exported backup is under your control, and any file-storage, cloud-drive, or sharing service you choose handles it under its own terms.

If you sign in and enable Family Sync, supported Baby Profile information and care records are sent to your selected service region and made available to authorized members of the same Family. Family members can view, add, and change shared information, so invite only people you trust and who are authorized to access the baby's information.

Current managed Family Sync requires the server to process readable sync content. It isn't an end-to-end encrypted service. We protect synced information with transport security, access controls, and other safeguards, but you shouldn't understand Family Sync to mean that the service is technically unable to read its contents.

Clearing local information on one device, signing out, or deleting the app doesn't delete your account or synced Family information.

## 5. Avatars and photos

Baby avatars and photos embedded in records may be stored with synced information. Global Region avatar assets use Cloudflare R2. China Region avatar assets use Alibaba Cloud infrastructure. Account avatars are handled by the account provider.

When a Family is deleted, we delete its avatars, record photos, and other active assets. We also clean up objects that are no longer used when an avatar is replaced or removed.

## 6. Voice records

Voice records prefer Apple's on-device speech features. If local transcription isn't available, server processing may:

1. Upload the recording to temporary storage in your selected service region.
2. Send the recording to Doubao speech services for transcription.
3. When more interpretation is needed, send the transcript, language, time, and necessary context to OpenAI to prepare a record for you to confirm.

Third-party speech and AI providers may process this information outside your selected service region. Server-processed audio is scheduled for deletion after processing. Audio, upload information, transcripts, and job metadata controlled by Cali Baby are physically deleted within 24 hours. Copies created by third-party providers are retained under their applicable agreements and legal obligations.

Recent voice-record history may also remain on your device and may be included in an exported backup. You can clear local voice history in the app.

## 7. Usage analytics and operational diagnostics

Usage analytics and operational diagnostics are separate.

Usage analytics is provided by PostHog and is enabled only if you explicitly opt in. It helps us understand which features are used and where a flow is commonly interrupted. Analytics may include a pseudonymous account or installation identifier, app and operating-system versions, feature names, and action outcomes. We don't send baby names, notes, photos, audio, transcripts, or precise care values to usage analytics. You can turn it off in Settings at any time.

Operational diagnostics from services such as Sentry help us find crashes, errors, performance problems, and security events. Diagnostics may include limited or pseudonymous account, Family, and device identifiers. We limit and scrub diagnostic content to avoid sending user-entered care content. Turning off usage analytics doesn't turn off the operational diagnostics needed to maintain the service.

When you visit the product, support, or legal pages on cali.so, Vercel Web Analytics processes page-view and coarse technical information. Website analytics isn't linked to Baby Profile information or care records and isn't controlled by the PostHog setting in the app.

PostHog and Sentry may process information in the United States.

## 8. When we disclose information to service providers

We let service providers handle information only as needed to provide and protect Cali Baby. The main categories are:

- Apple for app distribution, purchases, device capabilities, and system speech features.
- Clerk for sign-in, account identity, and account avatars.
- Railway, Cloudflare, and Alibaba Cloud for servers, databases, and asset storage.
- Doubao for server speech transcription.
- OpenAI for interpreting and organizing voice transcripts when needed.
- PostHog for usage analytics after you opt in.
- Sentry for error, crash, and performance diagnostics.
- Vercel for website analytics on the product, support, and legal pages.
- Email and support providers for requests you choose to send.

These providers handle information under our instructions or the terms that apply directly between you and them. We may also disclose necessary information when required by law, to protect users or the service, during a business reorganization, or when you direct us to do so.

## 9. Service regions and international processing

The Global Region currently uses service compute in Singapore, database storage in the United States, and Cloudflare R2 for assets. The China Region's main sync service and assets use Alibaba Cloud infrastructure in mainland China.

Selecting a service region doesn't mean every processing activity stays in that region. Account sign-in, App Store purchases, usage analytics you opt into, website analytics, operational diagnostics, and server voice processing may involve providers outside the region. Where applicable law requires additional notice, separate consent, or another transfer step, we provide it before the relevant processing begins.

When a Family migrates between regions, we may keep a read-only copy in the source region and create a new copy in the destination region. Selecting the China Region doesn't automatically delete the source copy. Deleting the Family removes active regional copies still controlled by Cali Baby.

## 10. Retention and deletion

We keep information only as long as needed to provide the feature, maintain security, and meet legal obligations. We don't keep it merely because it might be useful someday.

- Device records remain until you delete them, clear app data, or uninstall the app. You manage exported backups.
- Family information remains until the Family Owner deletes the Family or a record is deleted through the relevant product feature.
- After you delete an individual record, it is no longer shown or synced as an active record. Older mutation copies may remain until sync compaction completes; Family deletion also removes that history. We may retain a content-free deletion marker for as long as needed to keep the deleted record from reappearing.
- Server voice audio, upload information, transcripts, and job metadata controlled by Cali Baby are deleted within 24 hours. Speech and AI providers handle their copies under their applicable agreements and legal obligations.
- When you turn off usage analytics, we stop new PostHog analytics and reset or unlink the analytics identity in the app. When you delete an account, we delete or irreversibly unlink account analytics held by the provider. Operational diagnostics are kept as needed for security and incident handling and remain subject to content-scrubbing rules.
- Website analytics is kept only as long as needed for aggregate site traffic under the verified Vercel retention configuration and isn't linked to Baby Profile information or care records in the app.
- Support communications and purchase, fraud-prevention, security, and audit records are kept only as needed to handle the request, maintain security, or meet legal obligations.

Account deletion removes that caregiver's sign-in identity, account information, and Family memberships. It doesn't delete Family information that remains shared with other caregivers. An account that owns a Family with other members must explicitly transfer ownership first.

Only the Family Owner can delete a Family. Family deletion removes active Baby Profiles, care records, embedded photos, avatars, memberships, devices, invites, recovery data, and regional source copies still under our control. If the Owner is the only member, deleting the account uses the combined flow to delete the Family too.

Access is revoked immediately after final confirmation. Some external storage or provider cleanup may continue in the background. The app shows deletion as in progress and doesn't call it complete until every required deletion result has been verified.

We may retain a small set of App Store transaction, fraud-prevention, security, and audit records when legally or operationally required. These retained records don't contain care content. Restricted backup copies may remain until the applicable backup overwrite cycle completes; they aren't used for ordinary product features.

## 11. Your choices and rights

In the app, you can view or change most account, Baby Profile, and Family information; export records; manage Family members; turn off usage analytics; delete your account; or delete a Family you own.

Depending on where you live, you may also have rights to request access, correction, a copy, deletion, restriction, or withdrawal of consent. Email [contact@zolplay.com](mailto:contact@zolplay.com?subject=Cali%20Baby%20Privacy%20Request). We may need to verify your identity and Family authority before completing a request.

Withdrawing consent doesn't affect processing already completed lawfully before the withdrawal. Some information may not be deleted immediately when law, security, fraud prevention, or a dispute requires retention. We'll explain any applicable limit in our response.

## 12. Children and caregiver responsibility

Cali Baby is designed for parents, guardians, and other caregivers who have reached the age of legal majority where they live and can enter a binding agreement. It isn't intended for children to use directly.

Adults may enter information about a child, but they must be authorized to provide and share it with Family members. Don't allow a child to create an account or invite someone who isn't authorized to see the baby's information.

## 13. Security

We use measures such as transport security, access controls, service isolation, log scrubbing, and deletion processes to reduce the risk of unauthorized access, loss, or misuse. No storage or transmission method can be guaranteed completely secure.

Protect your device and account, use a reliable device lock, don't share sign-in credentials, and remove Family members who no longer need access.

## 14. No sale or targeted advertising

We don't sell personal information, share it for cross-context behavioral advertising, serve targeted ads based on activity across services, or use care records, photos, audio, or transcripts to build advertising profiles.

## 15. Changes to this policy

We may update this policy when the product, providers, or legal requirements change. We'll explain material changes through the app, website, or another appropriate channel and update the effective date.

## 16. Contact us

Privacy, data-rights, or legal requests: [contact@zolplay.com](mailto:contact@zolplay.com?subject=Cali%20Baby%20Privacy%20Request)

General product support: [hi@cali.so](mailto:hi@cali.so?subject=Cali%20Baby%20Support)

The mailing address depends on your service region:

- Zolplay LLC, 1021 E Lincolnway, Cheyenne, WY 82001, USA.
- 深圳市佐玩信息技术有限公司, 深圳市罗湖区桂园街道桂木园社区宝安南路2046宝丽大厦A座12G, China.

---

## 中文使用条款

Route: `/calibaby/terms`

Metadata title: `Cali 宝宝助手使用条款`

Metadata description: `阅读 Cali 宝宝助手关于账号、家庭共享、Cali Baby Pro、医疗边界和服务区域的使用条款。`

# Cali 宝宝助手使用条款

生效日期：发布时确定

请在使用 Cali 宝宝助手前阅读这些条款。下载、访问或使用 Cali 宝宝助手，表示你同意这些条款和我们的隐私政策。如果你不同意，请不要使用本服务。

## 1. 协议主体

你在 App 中选择的服务区域决定与你签订本条款的运营方。界面语言不会改变运营方。

- 全球区：Zolplay LLC，1021 E Lincolnway, Cheyenne, WY 82001, USA。
- 中国区：深圳市佐玩信息技术有限公司，深圳市罗湖区桂园街道桂木园社区宝安南路2046宝丽大厦A座12G。

本条款中的「我们」指与你所选服务区域对应的运营方。

如果你确认把家庭迁移到另一个服务区域，目标区域的运营方会负责迁移后的服务，目标运营方的条款适用于之后的使用。来源区域运营方仍按隐私政策负责其控制的只读来源副本。

## 2. 使用资格

你必须达到所在地的法定成年年龄，具有签订有效协议的能力，并有权为自己负责或有权照顾的儿童使用 Cali 宝宝助手。

Cali 宝宝助手供父母、监护人和其他照顾者使用，不供儿童直接使用。你只能记录和分享你有权提供的宝宝及照顾资料。

## 3. 服务内容

Cali 宝宝助手帮助你记录孕期和宝宝照顾中的观察与日常安排，包括喂养、睡眠、尿布、体温、成长及其他你选择使用的工具。部分功能可以在设备本地使用；账号、家庭同步、语音服务器处理和 Cali Baby Pro 等功能需要网络、第三方服务或购买资格。

我们可能添加、调整或停止某些功能。若变化会实质影响你正在使用的付费功能或数据，我们会在合理范围内提前说明，并提供适用法律要求的处理方式。

## 4. 账号与安全

你应提供准确的账号资料，保护设备和登录凭证，并对账号下发生的活动负责。发现未经授权的访问时，请尽快联系 [hi@cali.so](mailto:hi@cali.so?subject=Cali%20Baby%20Account%20Security)。

不要分享密码、验证信息或家庭访问资料。你需要确保自己选择了正确的服务区域；区域选择会影响运营方、同步基础设施和部分数据处理位置。

## 5. 家庭、成员与所有权

家庭让获得授权的照顾者共享宝宝资料和照顾记录。邀请成员前，你必须确认对方有权访问这些信息。成员对共享资料所做的添加、修改或删除会影响家庭中的其他成员。

每个家庭只有一位拥有者。拥有者负责成员关系和家庭本身。如果还有其他成员，拥有者必须明确把所有权转移给其中一位成员，才能删除自己的账号。我们不会自动指定新的拥有者。如果拥有者是家庭中唯一的成员，删除账号时必须同时删除家庭，不能留下没有拥有者的家庭。

只有拥有者可以删除家庭。家庭中只有一位成员时，拥有者会通过合并流程一起删除家庭与账号。

## 6. 你的内容

你保留自己添加内容所享有的权利。为了保存、同步、显示、转写、备份、保护和按你的指示删除内容，你授予对应运营方一项有限、非独占、免许可费的许可，仅在运营 Cali 宝宝助手所需的范围和时间内处理这些内容。

你保证有权提供内容，并且内容和你的使用方式不会侵犯他人的隐私、知识产权或其他权利。不要上传违法、有害、欺诈、恶意，或你无权处理的内容。

## 7. 隐私

我们的[隐私政策](/calibaby/privacy)说明信息如何保存在设备上、如何通过家庭同步与服务提供商处理，以及如何使用删除和数据权利功能。隐私政策是这些条款的一部分。

## 8. 不是医疗服务

Cali 宝宝助手用于记录和整理观察，不作为医疗器械使用，不提供诊断、处方、治疗建议或紧急服务，也不能代替医生、助产士或其他专业人员。

记录、提醒、趋势和语音整理结果可能不完整、不准确或延迟。你必须检查重要信息，并根据实际情况和专业意见作出健康决定。

如果你认为家长、孕妇或宝宝正处于紧急情况，请立即联系当地急救服务或合适的医疗专业人员，不要等待 App、提醒或支持回复。

## 9. Cali Baby Pro 与 Apple 购买

Cali Baby Pro 可能通过自动续订订阅或一次性购买提供。可用方案、价格、试用、期限和续订条件以购买时 Apple 显示的内容为准。

Apple 处理付款、续订、取消和退款。你可以在 Apple 账号中管理或取消订阅。除适用法律另有要求外，退款按 Apple 的政策处理。删除 Cali 宝宝助手账号不会自动取消 Apple 订阅，你需要在 Apple 账号中单独管理订阅。

Apple 标准最终用户许可协议适用于通过 App Store 获得的 App 许可；本条款作为补充，适用于 Cali 宝宝助手的账号、同步、内容、Pro 和其他服务。如果两者在 App 许可事项上发生冲突，以 Apple 标准最终用户许可协议为准。对应运营方而非 Apple 负责 Cali 宝宝助手服务的维护与支持。

## 10. 可接受使用

你不得：

- 非法使用服务，或侵害他人的权利；
- 试图获取不属于你的账号、家庭、密钥、记录或系统；
- 绕过安全、购买、访问或用量限制；
- 干扰服务，传播恶意代码，或对基础设施造成不合理负担；
- 在法律不允许的范围内反向工程、复制或转售服务；
- 使用自动化方式抓取个人资料，或利用服务伤害、监控或骚扰他人。

## 11. Cali 宝宝助手的权利

Cali 宝宝助手的名称、软件、界面、设计、图标、文字和其他由我们提供的内容受适用知识产权法律保护。这些条款只授予你个人、有限、可撤销、不可转让的使用权，不转让任何所有权。

如果你提交建议或反馈，你允许我们在不向你承担报酬或保密义务的情况下，用它改进产品。此许可不包括你随反馈意外提供的宝宝资料、照顾记录或其他个人信息。

## 12. 第三方服务

Cali 宝宝助手依赖 Apple、登录、云基础设施、语音、诊断和其他服务提供商。第三方服务有各自的条款和隐私规则，可能发生中断或变化，我们也无法控制第三方服务的全部行为。

## 13. 服务可用性与更新

服务不一定始终可用、无错误或适用于每一种设备和网络。维护、网络、提供商故障、安全事件或法律要求可能造成中断。

你可能需要安装更新才能继续安全使用某些功能。请定期导出重要记录的备份，并检查备份文件是否可以正常保存。

## 14. 退出、删除与暂停

你可以停止使用服务、退出登录、删除本机资料、删除账号，或在你是拥有者时删除家庭。这些操作的范围不同；退出登录或删除 App 不会自动删除同步资料。

删除账号会删除你的登录身份和家庭成员关系，但保留仍由其他照顾者共享的家庭资料。删除家庭会从活动服务中移除该家庭的共享资料，并需要单独的确认；有限的保留例外见隐私政策。

如果你严重或反复违反这些条款、危及其他用户或服务安全，或法律要求我们采取行动，我们可以限制或暂停相关访问。情况允许时，我们会提供通知和合理的申诉或数据取回方式。

## 15. 免责声明

在适用法律允许的最大范围内，Cali 宝宝助手按「现状」和「可用」状态提供。我们不保证记录、提醒、趋势、转写或其他结果完整、准确、及时，或适合特定用途。

这些条款不排除或限制适用法律不能排除的消费者权利、法定保证或其他责任。

## 16. 责任限制

在适用法律允许的最大范围内，对因使用或无法使用 Cali 宝宝助手产生的间接、附带、特殊、后果性或惩罚性损失，运营方不承担责任，包括数据丢失、利润损失或业务中断。

本条不限制因欺诈、故意不当行为、人身伤害，或适用法律规定不能限制的其他事项所产生的责任。你所在地的强制性消费者保护仍然适用。

## 17. 条款变更

我们可能因产品、提供商或法律要求发生变化而更新这些条款。重大变化会通过 App、网站或其他适当方式说明，并更新生效日期。若适用法律要求你重新同意，我们会在继续使用相关功能前征求同意。

## 18. 适用法律与争议

如果你使用全球区，本条款受美国怀俄明州法律管辖，不适用其法律冲突规则。除强制性消费者法律另有规定外，与本条款或 Cali 宝宝助手有关的争议，应提交位于怀俄明州拉勒米县的州法院或联邦法院。

如果你使用中国区，本条款受中华人民共和国法律管辖。与本条款或 Cali 宝宝助手有关的争议，应提交深圳市佐玩信息技术有限公司注册住所地有管辖权的人民法院。

无论选择哪个区域，本条都不剥夺你所在地不能通过合同放弃的消费者权利。

## 19. 联系我们

法律或隐私问题：[contact@zolplay.com](mailto:contact@zolplay.com?subject=Cali%20Baby%20Legal%20Request)

一般产品支持：[hi@cali.so](mailto:hi@cali.so?subject=Cali%20Baby%20Support)

---

## English Terms of Use

Route: `/en/calibaby/terms`

Metadata title: `Cali Baby Terms of Use`

Metadata description: `Read Cali Baby's terms for accounts, Family sharing, Cali Baby Pro, health boundaries, and service regions.`

# Cali Baby Terms of Use

Effective: To be set at publication

Please read these Terms before using Cali Baby. By downloading, accessing, or using Cali Baby, you agree to these Terms and our Privacy Policy. If you don't agree, don't use the service.

## 1. Who you're agreeing with

The service region you select in the app determines the operator you're entering into these Terms with. Your interface language doesn't change the operator.

- Global Region: Zolplay LLC, 1021 E Lincolnway, Cheyenne, WY 82001, USA.
- China Region: 深圳市佐玩信息技术有限公司, 深圳市罗湖区桂园街道桂木园社区宝安南路2046宝丽大厦A座12G, China.

In these Terms, “we” means the operator for your selected service region.

If you confirm a Family migration to another service region, the destination operator becomes responsible for the service after migration and the destination operator's Terms apply to later use. The source operator remains responsible under the Privacy Policy for any read-only source copy it controls.

## 2. Eligibility

You must have reached the age of legal majority where you live, be able to enter a binding agreement, and be authorized to use Cali Baby for yourself or a child in your care.

Cali Baby is for parents, guardians, and other caregivers. It isn't intended for children to use directly. You may record and share only Baby Profile and care information you're authorized to provide.

## 3. The service

Cali Baby helps you record observations and routines during pregnancy and baby care, including feeding, sleep, diapers, temperature, growth, and other tools you choose to use. Some features work locally on your device. Accounts, Family Sync, server voice processing, and Cali Baby Pro may require a network connection, third-party service, or purchase entitlement.

We may add, adjust, or discontinue features. If a change materially affects a paid feature you're using or your information, we'll provide reasonable notice and any remedy required by applicable law.

## 4. Accounts and security

Provide accurate account information, protect your device and sign-in credentials, and take responsibility for activity under your account. If you discover unauthorized access, contact [hi@cali.so](mailto:hi@cali.so?subject=Cali%20Baby%20Account%20Security) promptly.

Don't share passwords, verification details, or Family access material. Make sure you select the correct service region because it affects the operator, sync infrastructure, and some processing locations.

## 5. Families, members, and ownership

A Family lets authorized caregivers share Baby Profile information and care records. Before inviting someone, you must make sure they're authorized to access that information. A member's additions, changes, or deletions can affect everyone in the Family.

Every Family has one Owner. The Owner is responsible for membership and the Family itself. If other members remain, the Owner must explicitly transfer ownership to one of them before deleting their account. We don't appoint a new Owner automatically. If the Owner is the only member, deleting the account also requires deleting the Family so it can't be left without an Owner.

Only the Owner can delete a Family. A sole Owner uses the combined flow to delete the Family and account together.

## 6. Your content

You keep whatever rights you have in content you add. To save, sync, display, transcribe, back up, protect, and delete that content as you direct, you give the relevant operator a limited, non-exclusive, royalty-free license to process it only as needed to operate Cali Baby and only for as long as needed for that purpose.

You represent that you're allowed to provide the content and that the content and your use of it don't violate another person's privacy, intellectual property, or other rights. Don't upload content that is unlawful, harmful, fraudulent, malicious, or outside your authority to handle.

## 7. Privacy

Our [Privacy Policy](/en/calibaby/privacy) explains how information is stored on your device, handled through Family Sync and service providers, and managed through deletion and data-rights tools. The Privacy Policy forms part of these Terms.

## 8. Not a medical service

Cali Baby helps record and organize observations. It isn't intended for use as a medical device and doesn't provide a diagnosis, prescription, treatment recommendation, or emergency service. It doesn't replace a doctor, midwife, or other qualified professional.

Records, reminders, trends, and voice-generated results can be incomplete, inaccurate, or delayed. You must check important information and make health decisions based on the real situation and appropriate professional advice.

If you believe a parent, pregnant person, or baby may be in danger, contact local emergency services or an appropriate medical professional immediately. Don't wait for the app, a reminder, or support.

## 9. Cali Baby Pro and Apple purchases

Cali Baby Pro may be available through an auto-renewing subscription or one-time purchase. Available plans, prices, trials, periods, and renewal terms are the ones Apple shows when you purchase.

Apple handles payment, renewal, cancellation, and refunds. You can manage or cancel a subscription through your Apple account. Unless applicable law requires otherwise, refunds are handled under Apple's policies. Deleting your Cali Baby account doesn't automatically cancel an Apple subscription. You must manage the subscription separately through Apple.

Apple's Standard End User License Agreement governs the app license you receive through the App Store. These Terms supplement it and govern Cali Baby accounts, sync, content, Pro, and other services. If the documents conflict on an app-license matter, Apple's Standard EULA controls. The relevant operator, not Apple, is responsible for maintaining and supporting the Cali Baby services.

## 10. Acceptable use

You may not:

- Use the service unlawfully or violate another person's rights.
- Try to access an account, Family, key, record, or system that isn't yours.
- Bypass security, purchase, access, or usage limits.
- Disrupt the service, distribute malicious code, or place an unreasonable load on its infrastructure.
- Reverse engineer, copy, or resell the service where the law permits us to restrict that activity.
- Scrape personal information or use the service to harm, monitor, or harass another person.

## 11. Our rights

The Cali Baby name, software, interface, design, icons, text, and other content we provide are protected by applicable intellectual-property laws. These Terms give you a personal, limited, revocable, non-transferable right to use the service. They don't transfer ownership.

If you send suggestions or feedback, you allow us to use them to improve the product without payment or a confidentiality obligation to you. This permission doesn't extend to Baby Profile information, care records, or other personal information accidentally included with the feedback.

## 12. Third-party services

Cali Baby depends on Apple, sign-in, cloud infrastructure, speech, diagnostics, and other service providers. Third-party services have their own terms and privacy practices, may be interrupted or changed, and aren't entirely under our control.

## 13. Availability and updates

The service may not always be available, error-free, or compatible with every device and network. Maintenance, connectivity, provider failures, security events, or legal requirements may cause interruptions.

You may need to install updates to keep using some features safely. Export important records regularly and check that the backup file is saved successfully.

## 14. Leaving, deletion, and suspension

You can stop using the service, sign out, clear local information, delete your account, or delete a Family you own. These actions have different scopes. Signing out or deleting the app doesn't automatically delete synced information.

Account deletion removes your sign-in identity and Family memberships but preserves Family information still shared with other caregivers. Family deletion removes the Family's shared information from the active service and requires separate confirmation; see the Privacy Policy for limited retention exceptions.

We may limit or suspend access if you materially or repeatedly violate these Terms, put another user or the service at risk, or if law requires us to act. Where circumstances allow, we'll provide notice and a reasonable way to appeal or retrieve information.

## 15. Disclaimers

To the maximum extent permitted by law, Cali Baby is provided “as is” and “as available.” We don't warrant that records, reminders, trends, transcriptions, or other results will be complete, accurate, timely, or fit for a particular purpose.

These Terms don't exclude or limit consumer rights, statutory warranties, or other liability that applicable law doesn't allow us to exclude.

## 16. Limitation of liability

To the maximum extent permitted by law, the operator isn't liable for indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use Cali Baby, including loss of data, profit, or business interruption.

This section doesn't limit liability for fraud, willful misconduct, personal injury, or another matter that applicable law doesn't allow us to limit. Mandatory consumer protections where you live still apply.

## 17. Changes to these Terms

We may update these Terms when the product, providers, or legal requirements change. We'll explain material changes through the app, website, or another appropriate channel and update the effective date. If applicable law requires renewed agreement, we'll ask before you continue using the affected feature.

## 18. Governing law and disputes

If you use the Global Region, Wyoming law governs these Terms without regard to its conflict-of-law rules. Unless mandatory consumer law requires otherwise, disputes related to these Terms or Cali Baby must be brought in the state or federal courts located in Laramie County, Wyoming.

If you use the China Region, the laws of the People's Republic of China govern these Terms. Disputes related to these Terms or Cali Baby must be brought before a court with jurisdiction at the registered domicile of 深圳市佐玩信息技术有限公司.

Whichever region you select, this section doesn't take away consumer rights that can't be waived by contract where you live.

## 19. Contact us

Legal or privacy questions: [contact@zolplay.com](mailto:contact@zolplay.com?subject=Cali%20Baby%20Legal%20Request)

General product support: [hi@cali.so](mailto:hi@cali.so?subject=Cali%20Baby%20Support)
