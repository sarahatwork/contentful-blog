import React from 'react'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { BLOCKS } from '@contentful/rich-text-types'
import { z } from 'zod'
import FacebookIcon from '@iconscout/react-unicons/icons/uil-facebook'
import InstagramIcon from '@iconscout/react-unicons/icons/uil-instagram'
import StarIcon from '@iconscout/react-unicons/icons/uil-star'
import useRepeater from './useRepeater'

interface IProps {
  items: Queries.SocialMediaFragment['socialMedia']
}

const options = {
  renderNode: {
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const { gatsbyImage, description } = node.data.target
      return <GatsbyImage image={getImage(gatsbyImage)!} alt={description} />
    },
  },
}

const SCHEMA = z.array(
  z.object({
    network: z.union([
      z.literal('Facebook'),
      z.literal('Instagram'),
      z.literal("Dog's Instagram"),
    ]),
    url: z.string(),
  })
)

const SocialMedia: React.FC<IProps> = ({ items }) => {
  const socialItems = useRepeater({ items, schema: SCHEMA })
  if (!socialItems) return null

  return (
    <ul>
      {socialItems.map((item, i) => {
        switch (item.network) {
          case 'Facebook':
            return (
              <li key={i}>
                <a href={item.url}>
                  Facebook <FacebookIcon />
                </a>
              </li>
            )
          case 'Instagram':
            return (
              <li key={i}>
                <a href={item.url}>
                  Instagram <InstagramIcon />
                </a>
              </li>
            )
          case "Dog's Instagram":
            return (
              <li key={i}>
                <a href={item.url}>
                  Dog's Instagram <StarIcon />
                </a>
              </li>
            )
        }
      })}
    </ul>
  )
}
export default SocialMedia
