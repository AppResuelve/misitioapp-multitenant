const { cloudinary } = require('../../middleware/upload')
const { Media, Product } = require('../../models')
const { Op } = require('sequelize')

const uploadImage = async (fileBuffer, filename, folder = 'productos') => {
  const prefix = process.env.CLOUDINARY_FOLDER_PREFIX || ''
  const fullFolder = prefix ? `clients/${prefix}/${folder}` : `clients/${folder}`

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: fullFolder,
        public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}`,
        resource_type: 'image',
      },
      async (error, result) => {
        if (error) return reject(error)

        const media = await Media.create({
          url: result.secure_url,
          publicId: result.public_id,
          filename,
          size: result.bytes,
          mimeType: result.format,
          folder,
        })

        resolve(media)
      }
    )

    uploadStream.end(fileBuffer)
  })
}

const list = async (folder, options = {}) => {
  const where = {}
  if (folder) where.folder = folder
  if (options.trash) {
    where.deletedAt = { [Op.ne]: null }
  } else {
    where.deletedAt = null
  }
  return Media.findAll({ where, order: [['createdAt', 'DESC']] })
}

const checkUsage = async (id) => {
  const media = await Media.findByPk(id)
  if (!media) {
    throw Object.assign(new Error('Imagen no encontrada'), { status: 404 })
  }

  const products = await Product.findAll({
    attributes: ['id', 'name'],
    where: {
      images: { [Op.contains]: [media.url] },
    },
  })

  return {
    count: products.length,
    products: products.map((p) => ({ id: p.id, name: p.name })),
  }
}

const remove = async (id) => {
  const media = await Media.findByPk(id)
  if (!media) {
    throw Object.assign(new Error('Imagen no encontrada'), { status: 404 })
  }
  return media.update({ deletedAt: new Date() })
}

const forceDelete = async (id) => {
  const media = await Media.findByPk(id)
  if (!media) {
    throw Object.assign(new Error('Imagen no encontrada'), { status: 404 })
  }

  const products = await Product.findAll({
    where: {
      images: { [Op.contains]: [media.url] },
    },
  })

  for (const product of products) {
    product.images = product.images.filter((u) => u !== media.url)
    product.changed('images', true)
    await product.save()
  }

  await cloudinary.uploader.destroy(media.publicId)
  return media.destroy()
}

const restore = async (id) => {
  const media = await Media.findByPk(id)
  if (!media) {
    throw Object.assign(new Error('Imagen no encontrada'), { status: 404 })
  }
  return media.update({ deletedAt: null })
}

const emptyTrash = async () => {
  const trashed = await Media.findAll({ where: { deletedAt: { [Op.ne]: null } } })

  for (const media of trashed) {
    const products = await Product.findAll({
      where: { images: { [Op.contains]: [media.url] } },
    })

    for (const product of products) {
      product.images = product.images.filter((u) => u !== media.url)
      product.changed('images', true)
      await product.save()
    }

    await cloudinary.uploader.destroy(media.publicId)
    await media.destroy()
  }

  return { deleted: trashed.length }
}

const moveToFolder = async (id, targetFolder) => {
  const media = await Media.findByPk(id)
  if (!media) {
    throw Object.assign(new Error('Imagen no encontrada'), { status: 404 })
  }

  const prefix = process.env.CLOUDINARY_FOLDER_PREFIX || ''
  const oldPublicId = media.publicId
  const basename = oldPublicId.split('/').pop()
  const newPublicId = prefix
    ? `clients/${prefix}/${targetFolder}/${basename}`
    : `clients/${targetFolder}/${basename}`

  if (oldPublicId === newPublicId) {
    return media
  }

  try {
    const result = await cloudinary.uploader.rename(oldPublicId, newPublicId, {
      resource_type: 'image',
    })
  } catch (renameErr) {
    throw renameErr
  }

  const oldUrl = media.url

  const updated = await media.update({
    publicId: result.public_id,
    url: result.secure_url,
    folder: targetFolder,
  })

  // Actualizar productos que referencian la URL vieja
  const products = await Product.findAll({
    where: { images: { [Op.contains]: [oldUrl] } },
  })

  for (const product of products) {
    product.images = product.images.map((u) => u === oldUrl ? result.secure_url : u)
    product.changed('images', true)
    await product.save()
  }

  return updated
}

module.exports = { uploadImage, list, remove, forceDelete, restore, emptyTrash, moveToFolder, checkUsage }
