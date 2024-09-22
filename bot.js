const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});
const fs = require('fs');
const path = require('path');

const productsFile = path.join(__dirname, 'products.json');

const prefix = '-'; // حط البريفيكس حقك هناw
const shopbank = '1188561532750143519'; // ايدي الشخص الي تتحول له الفلوس
const adminRoleId = '1259415918983778366'; // رتبة آدمن يقدر يضيف منتجات، مب شرط يكون ادمن
let products = [];

const loadProducts = () => {
  try {
    const data = fs.readFileSync(productsFile, 'utf8');
    products = JSON.parse(data);
    console.log('Products loaded successfully');
  } catch (error) {
    console.log('No existing products file found. Starting with an empty product list.');
    products = [];
  }
};

const saveProducts = () => {
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf8');
  console.log('Products saved successfully');
};

const calculateExactFee = (desiredAmount) => {
  desiredAmount = parseInt(desiredAmount);
  const totalAmount = Math.ceil(desiredAmount / 0.95);
  const fee = totalAmount - desiredAmount;
  return { fee, totalAmount };
};

const simpleSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
};

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!, made by :7rag`);
  loadProducts();
});

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'shopadd' && message.member.roles.cache.has(adminRoleId)) {
    const embed = new EmbedBuilder()
      .setTitle('اضافة منتج للمتجر')
      .setDescription('اضغط الزر ادناه لإضافة منتج جديد:')
      .setColor('#c22424');

    const addButton = new ButtonBuilder()
      .setCustomId('add_product')
      .setLabel('اضافة منتج')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(addButton);

    await message.channel.send({ embeds: [embed], components: [row] });
  }

  if (command === 'shop') {
    const embed = new EmbedBuilder()
      .setTitle('المتجر')
      .setDescription('اهلا بك في المتجر')
      .setColor('#c22424');
  
    if (products.length === 0) {
      embed.setDescription('لا توجد منتجات في المتجر حاليًا.');
      return message.channel.send({ embeds: [embed] });
    }
  
    products.forEach((product, index) => {
      embed.addFields({ name: product.name, value: `السعر:${product.price} كريديت\nالوصف:${product.description}` });
    });
  
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_product')
      .setPlaceholder('اخـتر منـتجًا');
  
    const limitedProducts = products.slice(0, 25);
  
    limitedProducts.forEach((product, index) => {
      selectMenu.addOptions({
        label: product.name,
        description: `السعر :${product.price} كريديت`,
        value: index.toString()
      });
    });
  
    if (limitedProducts.length > 0) {
      const row = new ActionRowBuilder().addComponents(selectMenu);
      await message.channel.send({ embeds: [embed], components: [row] });
    } else {
      await message.channel.send({ embeds: [embed] });
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === 'add_product') {
      const modal = new ModalBuilder()
        .setCustomId('add_product_modal')
        .setTitle('اضافة منتج للمتجر');

      const nameInput = new TextInputBuilder()
        .setCustomId('productName')
        .setLabel("اسم المنتج")
        .setStyle(TextInputStyle.Short);

      const priceInput = new TextInputBuilder()
        .setCustomId('productPrice')
        .setLabel("السعر ( بالكريديت )")
        .setStyle(TextInputStyle.Short);

      const descriptionInput = new TextInputBuilder()
        .setCustomId('productDescription')
        .setLabel("الوصف")
        .setStyle(TextInputStyle.Paragraph);

      const dmMessageInput = new TextInputBuilder()
        .setCustomId('productDMMessage')
        .setLabel("المُنتج الذي صيصل للخاص")
        .setStyle(TextInputStyle.Paragraph);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(priceInput),
        new ActionRowBuilder().addComponents(descriptionInput),
        new ActionRowBuilder().addComponents(dmMessageInput)
      );

      await interaction.showModal(modal);
    }
  } else if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'select_product') {
      const index = parseInt(interaction.values[0]);
      const product = products[index];

      const { fee, totalAmount } = calculateExactFee(product.price);

      await interaction.reply({ content: `لشراء :${product.name}, المرجوا استخدام هذا الأمر لتحويل المبلغ: \```c ${shopbank} ${totalAmount}\```. يحتوي على ضريبة :${fee} كريديت. سيكون مبلغ الدفع كاملاً${product.price} كريديت.`, ephemeral: true });

      const probotId = '282859044593598464';
      const filter = m => m.author.id === probotId;
      const collector = interaction.channel.createMessageCollector({ filter, time: 300000 });

      collector.on('collect', async (m) => {
        console.log('Collected message:', m.content);
        const similarityThreshold = 0.3;
        const sampleTransactionMessageEn = `has transferred${product.price} to`;
        const sampleTransactionMessageAr = `قام بتحويل \`$${product.price}\` لـ`;
        const similarityEn = simpleSimilarity(m.content, sampleTransactionMessageEn);
        const similarityAr = simpleSimilarity(m.content, sampleTransactionMessageAr);

        console.log('التشابه (EN):', similarityEn);
        console.log('التشابه (AR):', similarityAr);

        if (similarityEn >= similarityThreshold || similarityAr >= similarityThreshold) {
          const amountMatch = m.content.match(/`\$(\d+)`/);
          const recipientMatch = m.content.match(/to\s*<@!?(\d+)>/i) || m.content.match(/لـ\s*<@!?(\d+)>/i);

          if (amountMatch && recipientMatch) {
            const amountSent = parseInt(amountMatch[1]);
            const recipientId = recipientMatch[1];

            console.log('الكمية المُرسلة:', amountSent, 'رقم التحويل:', recipientId);

            if (amountSent === parseInt(product.price) && recipientId === shopbank) {
              try {
                await interaction.user.send(product.dmMessage);
                await interaction.followUp({ content: 'تمت العملية بنـجاح! ✔، شيك الخاص.', ephemeral: false });
                console.log('تم ايصال المنتج :', interaction.user.tag);
              } catch (error) {
                console.error('خـطأ في ايصال المنتج :', error);
                await interaction.followUp({ content: 'تمت عملية الشراء بنجاح، لكن لم اتمكن من ارسال المنتج!، تواصل مع المسؤول.', ephemeral: true });
              }
              collector.stop('success');
            } else {
              await interaction.followUp({ content: 'لقد كتبت رقم تحويل خاطئ!.', ephemeral: true });
            }
          }
        }
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time') {
          interaction.followUp({ content: 'لقد انتهى وقت الشراء المحدد، كرر مرة اخرى...', ephemeral: true });
        }
      });
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === 'add_product_modal') {
      const name = interaction.fields.getTextInputValue('productName');
      const price = interaction.fields.getTextInputValue('productPrice');
      const description = interaction.fields.getTextInputValue('productDescription');
      const dmMessage = interaction.fields.getTextInputValue('productDMMessage');

      products.push({ name, price, description, dmMessage });
      saveProducts();

      await interaction.reply({ content: `تمت اضافة المنتج "${name}" للمتجر!.`, ephemeral: true });
    }
  }
});

process.on('SIGINT', () => {
  console.log('Bot is shutting down...');
  saveProducts();
  process.exit();
});

client.login(process.env.token);
